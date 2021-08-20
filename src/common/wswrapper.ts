import EventEmitter from 'events'

import WebSocket from 'ws'

/**
 * Provides `EventEmitter` interface for native browser `WebSocket`,
 * same, as `ws` package provides.
 */
class WSWrapper extends EventEmitter {
  public static readonly CONNECTING = 0
  public static readonly OPEN = 1
  public static readonly CLOSING = 2
  public static readonly CLOSED = 3
  private readonly ws: WebSocket

  /**
   * Construct a WSWrapper.
   *
   * @param url - URL to connect to.
   */
  public constructor(url: string) {
    super()
    this.setMaxListeners(Infinity)

    this.ws = new WebSocket(url)

    this.ws.onclose = (): void => {
      this.emit('close')
    }

    this.ws.onopen = (): void => {
      this.emit('open')
    }

    this.ws.onerror = (error): void => {
      this.emit('error', error)
    }

    this.ws.onmessage = (message): void => {
      this.emit('message', message.data)
    }
  }

  /**
   * Close the underlying WebSocket Connection.
   */
  public close(): void {
    if (this.readyState === 1) {
      this.ws.close()
    }
  }

  /**
   * Send a message with WebSocket.
   *
   * @param message - Message to send.
   */
  public send(message: string): void {
    this.ws.send(message)
  }

  /**
   * Get readyState of underlying WebSocket.
   *
   * @returns State of WebSocket Connection.
   */
  public get readyState(): number {
    return this.ws.readyState
  }
}

export = WSWrapper
