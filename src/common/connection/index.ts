import {EventEmitter} from 'events'

import WebSocket from 'ws'

import type {
  SubscribeRequest,
  SubscribeResponse,
  Request,
  Response
} from '../../models/methods'
import {
  DisconnectedError,
  NotConnectedError,
  ConnectionError,
  RippledNotInitializedError,
  RippleError
} from '../errors'

import ExponentialBackoff from './backoff'
import {ConnectionOptions, ConnectionConfig} from './connectionConfig'
import ConnectionManager from './connectionManager'
import LedgerHistory from './ledgerHistory'
import RequestManager from './requestManager'
import {websocketSendAsync} from './utils'

//
// Represents an intentionally triggered web-socket disconnect code.
// WebSocket spec allows 4xxx codes for app/library specific codes.
// See: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
//
const INTENTIONAL_DISCONNECT_CODE = 4000
const MAX_BACKOFF = 60000
const MIN_BACKOFF = 100

class Connection extends EventEmitter {
  private readonly url: string
  private ws: null | WebSocket = null
  private readonly reconnectTimeoutID: null | NodeJS.Timeout = null
  private heartbeatIntervalID: null | NodeJS.Timeout = null
  private readonly retryConnectionBackoff = new ExponentialBackoff({
    min: MIN_BACKOFF,
    max: MAX_BACKOFF
  })

  private readonly config: ConnectionConfig
  private readonly ledgers: LedgerHistory = new LedgerHistory()
  private readonly requestManager = new RequestManager()
  private readonly connectionManager = new ConnectionManager()

  /**
   * Construct a connection.
   *
   * @param url - Url to connect to.
   * @param options - Connection Options.
   */
  public constructor(url?: string, options: ConnectionOptions = {}) {
    super()
    this.setMaxListeners(Infinity)
    this.url = url
    this.config = new ConnectionConfig(options)
  }

  /**
   * Test if connection is connected.
   *
   * @returns True if Connection is connected.
   */
  public isConnected(): boolean {
    return this.state === WebSocket.OPEN
  }

  /**
   * Get the Websocket connection URL.
   *
   * @returns The Websocket connection URL.
   */
  public getUrl(): string {
    return this.url
  }

  /**
   * Connect to rippled server.
   *
   * @returns When Connection is connected.
   */
  public async connect(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve
    }
    if (this.state === WebSocket.CONNECTING) {
      return this.connectionManager.awaitConnection()
    }
    if (!this.url) {
      return Promise.reject(
        new ConnectionError('Cannot connect because no server was specified')
      )
    }
    if (this.ws) {
      return Promise.reject(
        new RippleError('Websocket connection never cleaned up.', {
          state: this.state
        })
      )
    }

    // Create the connection timeout, in case the connection hangs longer than expected.
    const connectionTimeoutID = setTimeout(() => {
      this.onConnectionFailed(
        new ConnectionError(
          `Error: connect() timed out after ${this.config.connectionTimeout} ms. ` +
            `If your internet connection is working, the rippled server may be blocked or inaccessible. ` +
            `You can also try setting the 'connectionTimeout' option in the Client constructor.`
        )
      )
    }, this.config.connectionTimeout)

    // Connection listeners: these stay attached only until a connection is done/open.
    this.ws = createWebSocket(this.url, this.config)
    this.ws.on('error', this.onConnectionFailed)
    this.ws.on('error', () => clearTimeout(connectionTimeoutID))
    this.ws.on('close', this.onConnectionFailed)
    this.ws.on('close', () => clearTimeout(connectionTimeoutID))

    this.ws.once('open', async () => {
      // Once the connection completes successfully, remove all old listeners
      this.ws.removeAllListeners()
      clearTimeout(connectionTimeoutID)
      // Add new, long-term connected listeners for messages and errors
      this.ws.on('message', (message: string) => this.onMessage(message))
      this.ws.on('error', (error) =>
        this.emit('error', 'websocket', error.message, error)
      )
      // Handle a closed connection: reconnect if it was unexpected
      this.ws.once('close', (code) => {
        this.clearHeartbeatInterval()
        this.requestManager.rejectAll(
          new DisconnectedError('websocket was closed')
        )
        this.ws.removeAllListeners()
        this.ws = null
        this.emit('disconnected', code)
        // If this wasn't a manual disconnect, then lets reconnect ASAP.
        if (code !== INTENTIONAL_DISCONNECT_CODE) {
          const retryTimeout = this.retryConnectionBackoff.duration()
          this.config.trace(
            'reconnect',
            `Retrying connection in ${retryTimeout}ms.`
          )
          this.emit('reconnecting', this.retryConnectionBackoff.attempts)
          // Start the reconnect timeout, but set it to `this.reconnectTimeoutID`
          // so that we can cancel one in-progress on disconnect.
          this.reconnectTimeoutID = setTimeout(() => {
            this.reconnect().catch((error) => {
              this.emit('error', 'reconnect', error.message, error)
            })
          }, retryTimeout)
        }
      })

      // Finalize the connection and resolve all awaiting connect() requests
      try {
        this.retryConnectionBackoff.reset()
        await this.subscribeToLedger()
        this.startHeartbeatInterval()
        this.connectionManager.resolveAllAwaiting()
        this.emit('connected')
      } catch (error) {
        this.connectionManager.rejectAllAwaiting(error)
        await this.disconnect().catch(() => {}) // Ignore this error, propagate the root cause.
      }
    })
    return this.connectionManager.awaitConnection()
  }

  /**
   * Disconnect the websocket connection.
   * We never expect this method to reject. Even on "bad" disconnects, the websocket
   * should still successfully close with the relevant error code returned.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent for the full list.
   * If no open websocket connection exists, resolve with no code (`undefined`).
   */
  public disconnect(): Promise<number | undefined> {
    clearTimeout(this.reconnectTimeoutID)
    this.reconnectTimeoutID = null
    if (this.state === WebSocket.CLOSED || !this.ws) {
      return Promise.resolve(undefined)
    }
    return new Promise((resolve) => {
      this.ws.once('close', (code) => resolve(code))
      // Connection already has a disconnect handler for the disconnect logic.
      // Just close the websocket manually (with our "intentional" code) to
      // trigger that.
      if (this.state !== WebSocket.CLOSING) {
        this.ws.close(INTENTIONAL_DISCONNECT_CODE)
      }
    })
  }

  /**
   * Disconnect the websocket, then connect again.
   */
  public async reconnect(): Promise<void> {
    // NOTE: We currently have a "reconnecting" event, but that only triggers
    // through an unexpected connection retry logic.
    // See: https://github.com/ripple/ripple-lib/pull/1101#issuecomment-565360423
    this.emit('reconnect')
    await this.disconnect()
    await this.connect()
  }

  /**
   * Get FeeBase.
   *
   * @returns FeeBase once ledger history is ready.
   */
  public async getFeeBase(): Promise<number> {
    await this.waitForReady()
    return this.ledgers.feeBase
  }

  /**
   * Get FeeRef.
   *
   * @returns FeeRef once ledger history is ready.
   */
  public async getFeeRef(): Promise<number> {
    await this.waitForReady()
    return this.ledgers.feeRef
  }

  /**
   * Get LedgerIndex.
   *
   * @returns LedgerIndex once ledger history is ready.
   */
  public async getLedgerIndex(): Promise<number> {
    await this.waitForReady()
    return this.ledgers.latestVersion
  }

  /**
   * Get ReserveBase.
   *
   * @returns ReserveBase once ledger history is ready.
   */
  public async getReserveBase(): Promise<number> {
    await this.waitForReady()
    return this.ledgers.reserveBase
  }

  /**
   * Returns true if the given range of ledger versions exist in history
   * (inclusive).
   *
   * @param lowIndex - Low end of range.
   * @param highIndex - High end of range.
   * @returns True if contains ledgerRange.
   */
  public async hasLedgerRange(
    lowIndex: number,
    highIndex?: number
  ): Promise<boolean> {
    // You can call hasRange with a potentially unknown upper limit, which
    // will just act as a check on the lower limit.
    if (!highIndex) {
      return this.hasLedgerVersion(lowIndex)
    }
    await this.waitForReady()
    return this.ledgers.hasLedgerRange(lowIndex, highIndex)
  }

  /**
   * Returns true if the given ledger index exists in history.
   *
   * @param ledgerIndex - Index of ledger.
   * @returns True if ledger history includes ledgerIndex.
   */
  public async hasLedgerVersion(ledgerIndex: number): Promise<boolean> {
    await this.waitForReady()
    return this.ledgers.hasLedgerIndex(ledgerIndex)
  }

  public async request(request: SubscribeRequest): Promise<SubscribeResponse>
  public async request(request: any): Promise<any>

  /**
   * Send a request to rippled.
   *
   * @param request - Request to send to Rippled.
   * @param timeout - How long to wait on hung response.
   * @returns Response from rippled.
   * @throws When not connected to a server.
   */
  public async request(request: Request, timeout?: number): Promise<Response> {
    if (!this.shouldBeConnected) {
      throw new NotConnectedError()
    }
    const [id, message, responsePromise] = this.requestManager.createRequest(
      request,
      timeout || this.config.timeout
    )
    this.config.trace('send', message)
    websocketSendAsync(this.ws, message).catch((error: Error) => {
      this.requestManager.reject(id, error)
    })

    return responsePromise
  }

  /**
   * A heartbeat is just a "ping" command, sent on an interval.
   * If this succeeds, we're good. If it fails, disconnect so that the consumer can reconnect, if desired.
   */
  private async heartbeat(): Promise<void> {
    try {
      await this.request({command: 'ping'})
    } catch {
      /** Ping failed */
    }

    await this.reconnect().catch((err: Error) => {
      this.emit('error', 'reconnect', err.message, err)
    })
  }

  /**
   * Subscribe to the Ledger Stream.
   *
   * @throws When Rippled doesn't have any validated ledgers.
   */
  private async subscribeToLedger(): Promise<void> {
    const req: SubscribeRequest = {
      command: 'subscribe',
      streams: ['ledger']
    }

    const data: SubscribeResponse = await this.request(req)

    // If rippled instance doesn't have validated ledgers, disconnect and then reject.
    if (Object.keys(data).length === 0 || !data.result.ledger_index) {
      try {
        await this.disconnect()
      } catch (_error) {
        // Ignore this error, propagate the root cause.
      }

      throw new RippledNotInitializedError('Rippled not initialized')
    }
    this.ledgers.update(data.result)
  }

  /**
   * Wait for a valid connection before resolving. Useful for deferring methods
   * until a connection has been established.
   *
   * @returns A promise that will resolve when connection is ready.
   */
  private async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.shouldBeConnected) {
        reject(new NotConnectedError())
      } else if (this.state === WebSocket.OPEN) {
        resolve()
      } else {
        this.once('connected', () => resolve())
      }
    })
  }

  private onConnectionFailed(errorOrCode?: Error | number): void {
    if (this.ws !== undefined) {
      this.ws.removeAllListeners()
      this.ws.on('error', () => {
        // Correctly listen for -- but ignore -- any future errors: If you
        // don't have a listener on "error" node would log a warning on error.
      })
      this.ws.close()
      this.ws = null
    }

    if (typeof errorOrCode === 'number') {
      this.connectionManager.rejectAllAwaiting(
        new NotConnectedError(`Connection failed with code ${errorOrCode}.`, {
          code: errorOrCode
        })
      )
    } else if (errorOrCode.message) {
      this.connectionManager.rejectAllAwaiting(
        new NotConnectedError(errorOrCode.message, errorOrCode)
      )
    } else {
      this.connectionManager.rejectAllAwaiting(
        new NotConnectedError('Connection failed.')
      )
    }
  }

  /**
   * Handles a message from rippled.
   *
   * @param message - Message received from rippled.
   */
  private onMessage(message): void {
    this.config.trace('receive', message)
    let data: any
    try {
      data = JSON.parse(message)
    } catch (error) {
      this.emit('error', 'badMessage', error.message, message)
      return
    }
    if (data.type == null && data.error) {
      this.emit('error', data.error, data.error_message, data) // e.g. slowDown
      return
    }
    if (data.type) {
      this.emit(data.type, data)
    }
    if (data.type === 'ledgerClosed') {
      this.ledgers.update(data)
    }
    if (data.type === 'response') {
      try {
        this.requestManager.handleResponse(data)
      } catch (error) {
        this.emit('error', 'badMessage', error.message, message)
      }
    }
  }

  /**
   * Returns the state of the Websocket connection.
   *
   * @returns Websocket state.
   */
  private get state(): number {
    return this.ws === null ? this.ws.readyState : WebSocket.CLOSED
  }

  /**
   * Test if Websocket should be connected.
   *
   * @returns True if websocket is not null.
   */
  private get shouldBeConnected(): boolean {
    return this.ws !== null
  }

  private clearHeartbeatInterval(): void {
    clearInterval(this.heartbeatIntervalID)
  }

  private startHeartbeatInterval(): void {
    this.clearHeartbeatInterval()
    this.heartbeatIntervalID = setInterval(
      () => this.heartbeat(),
      this.config.timeout
    )
  }
}
export default Connection
