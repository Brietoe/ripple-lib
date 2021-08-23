import {Request, Response} from '../../models/methods'
import {ResponseFormatError, RippledError, TimeoutError} from '../errors'

interface RequestPromise {
  resolve: (data: Response) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Responses come in over the WS connection
 * after-the-fact, so this manager will tie that response to resolve the
 * original request.
 */
class RequestManager {
  private nextId = 0
  private promisesAwaitingResponse: RequestPromise[] = []

  /**
   * Cancels an outstanding request.
   *
   * @param id - Index of the Promise to cancel.
   */
  public cancel(id: number): void {
    const {timer} = this.promisesAwaitingResponse[id]
    clearTimeout(timer)
    this.promisesAwaitingResponse[id] = undefined
  }

  /**
   * Resolve promise at index id.
   *
   * @param id - Index of the request to resolve.
   * @param data - Data to resolve the promise with.
   */
  public resolve(id: number, data: Response): void {
    const {timer, resolve} = this.promisesAwaitingResponse[id]
    clearTimeout(timer)
    resolve(data)
    this.promisesAwaitingResponse[id] = undefined
  }

  /**
   * Reject promise at index id.
   *
   * @param id - Index to reject promise at.
   * @param error - Error to reject promise with.
   */
  public reject(id: number, error: Error): void {
    const {timer, reject} = this.promisesAwaitingResponse[id]
    clearTimeout(timer)
    reject(error)
    this.promisesAwaitingResponse[id] = undefined
  }

  /**
   * Reject all outstanding promises.
   *
   * @param error - Error to reject promise with.
   */
  public rejectAll(error: Error): void {
    this.promisesAwaitingResponse.forEach((_promise, idx) => {
      this.reject(idx, error)
    })
  }

  /**
   * Creates a new WebSocket request. This sets up a timeout timer to catch
   * hung responses, and a promise that will resolve with the response once
   * the response is seen & handled.
   *
   * @param data - Request to make to the ledger.
   * @param timeout - How long to wait on a hung response.
   * @returns Tuple of id,.
   */
  public createRequest(
    data: Request,
    timeout: number
  ): [number, string, Promise<Response>] {
    this.nextId += 1
    const newId = this.nextId
    const newData = JSON.stringify({...data, id: newId})
    const timer = setTimeout(
      () => this.reject(newId, new TimeoutError()),
      timeout
    )

    // Node.js won't exit if a timer is still running, so we tell Node to ignore.
    // (Node will still wait for the request to complete).
    if (timer.unref) {
      timer.unref()
    }

    const newPromise = new Promise(
      (resolve: (resp: Response) => void, reject: (err: Error) => void) => {
        this.promisesAwaitingResponse[newId] = {resolve, reject, timer}
      }
    )

    return [newId, newData, newPromise]
  }

  /**
   * Handle a "response" (any message with `{type: "response"}`). Responses
   * match to the earlier request handlers, and resolve/reject based on the
   * data received.
   *
   * @param data - Response from Rippled.
   * @throws When id doesn't match expected id.
   */
  public handleResponse(data: Response): void {
    if (!Number.isInteger(data.id) || data.id < 0) {
      throw new ResponseFormatError('valid id not found in response', data)
    }
    if (!this.promisesAwaitingResponse[data.id]) {
      return
    }
    if (data.status === 'error') {
      const error = new RippledError(data.error_message || data.error, data)
      this.reject(Number(data.id), error)
      return
    }
    if (data.status !== 'success') {
      const error = new ResponseFormatError(
        `unrecognized status: ${data.status}`,
        data
      )
      this.reject(Number(data.id), error)
      return
    }
    this.resolve(Number(data.id), data.result)
  }
}

export default RequestManager
