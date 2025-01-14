import {
  ResponseFormatError,
  RippledError,
  TimeoutError,
  XrplError,
} from '../errors'
import { Response } from '../models/methods'
import { BaseRequest, ErrorResponse } from '../models/methods/baseMethod'

/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Responses come in over the WS connection
 * after-the-fact, so this manager will tie that response to resolve the
 * original request.
 */
export default class RequestManager {
  private nextId = 0
  private readonly promisesAwaitingResponse = new Map<
    string | number,
    {
      resolve: (value: Response | PromiseLike<Response>) => void
      reject: (value: Error) => void
      timer: NodeJS.Timeout
    }
  >()

  /**
   * Cancels a request.
   *
   * @param id - ID of the request.
   * @throws Error if no existing promise with the given ID.
   */
  public cancel(id: string | number): void {
    const promise = this.promisesAwaitingResponse.get(id)
    if (promise == null) {
      throw new Error(`No existing promise with id ${id}`)
    }
    clearTimeout(promise.timer)
    this.deletePromise(id)
  }

  /**
   * Successfully resolves a request.
   *
   * @param id - ID of the request.
   * @param response - Response to return.
   * @throws Error if no existing promise with the given ID.
   */
  public resolve(id: string | number, response: Response): void {
    const promise = this.promisesAwaitingResponse.get(id)
    if (promise == null) {
      throw new Error(`No existing promise with id ${id}`)
    }
    clearTimeout(promise.timer)
    promise.resolve(response)
    this.deletePromise(id)
  }

  /**
   * Rejects a request.
   *
   * @param id - ID of the request.
   * @param error - Error to throw with the reject.
   * @throws Error if no existing promise with the given ID.
   */
  public reject(id: string | number, error: Error): void {
    const promise = this.promisesAwaitingResponse.get(id)
    if (promise == null) {
      throw new Error(`No existing promise with id ${id}`)
    }
    clearTimeout(promise.timer)
    // TODO: figure out how to have a better stack trace for an error
    promise.reject(error)
    this.deletePromise(id)
  }

  /**
   * Reject all pending requests.
   *
   * @param error - Error to throw with the reject.
   */
  public rejectAll(error: Error): void {
    this.promisesAwaitingResponse.forEach((_promise, id, _map) => {
      this.reject(id, error)
      this.deletePromise(id)
    })
  }

  /**
   * Creates a new WebSocket request. This sets up a timeout timer to catch
   * hung responses, and a promise that will resolve with the response once
   * the response is seen & handled.
   *
   * @param request - Request to create.
   * @param timeout - Timeout length to catch hung responses.
   * @returns Request ID, new request form, and the promise for resolving the request.
   * @throws XrplError if request with the same ID is already pending.
   */
  public createRequest<T extends BaseRequest>(
    request: T,
    timeout: number,
  ): [string | number, string, Promise<Response>] {
    let newId: string | number
    if (request.id == null) {
      newId = this.nextId
      this.nextId += 1
    } else {
      newId = request.id
    }
    const newRequest = JSON.stringify({ ...request, id: newId })
    const timer = setTimeout(
      () => this.reject(newId, new TimeoutError()),
      timeout,
    )
    // Node.js won't exit if a timer is still running, so we tell Node to ignore.
    // (Node will still wait for the request to complete).
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Reason above.
    if (timer.unref) {
      timer.unref()
    }
    if (this.promisesAwaitingResponse.has(newId)) {
      throw new XrplError(`Response with id '${newId}' is already pending`)
    }
    const newPromise = new Promise<Response>(
      (resolve: (value: Response | PromiseLike<Response>) => void, reject) => {
        this.promisesAwaitingResponse.set(newId, { resolve, reject, timer })
      },
    )

    return [newId, newRequest, newPromise]
  }

  /**
   * Handle a "response". Responses match to the earlier request handlers,
   * and resolve/reject based on the data received.
   *
   * @param response - The response to handle.
   * @throws ResponseFormatError if the response format is invalid, RippledError if rippled returns an error.
   */
  public handleResponse(response: Partial<Response | ErrorResponse>): void {
    if (
      response.id == null ||
      !(typeof response.id === 'string' || typeof response.id === 'number')
    ) {
      throw new ResponseFormatError('valid id not found in response', response)
    }
    if (!this.promisesAwaitingResponse.has(response.id)) {
      return
    }
    if (response.status == null) {
      const error = new ResponseFormatError('Response has no status')
      this.reject(response.id, error)
    }
    if (response.status === 'error') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We know this must be true
      const errorResponse = response as Partial<ErrorResponse>
      const error = new RippledError(
        errorResponse.error_message ?? errorResponse.error,
        errorResponse,
      )
      this.reject(response.id, error)
      return
    }
    if (response.status !== 'success') {
      const error = new ResponseFormatError(
        `unrecognized response.status: ${response.status ?? ''}`,
        response,
      )
      this.reject(response.id, error)
      return
    }
    // status no longer needed because error is thrown if status is not "success"
    delete response.status
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Must be a valid Response here
    this.resolve(response.id, response as unknown as Response)
  }

  /**
   * Delete a promise after it has been returned.
   *
   * @param id - ID of the request.
   */
  private deletePromise(id: string | number): void {
    this.promisesAwaitingResponse.delete(id)
  }
}
