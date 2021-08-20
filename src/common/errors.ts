/* eslint-disable max-classes-per-file -- Classes extend RippleError */

import {inspect} from 'util'

import * as browserHacks from './browser-hacks'

class RippleError extends Error {
  public name: string
  public message: string
  private readonly data?: any

  /**
   * Construct a RippleError.
   *
   * @param message - Message accompanying the error.
   * @param data - Any data relevant to the error.
   */
  public constructor(message = '', data: any = {}) {
    super(message)

    this.name = browserHacks.getConstructorName(this)
    this.message = message
    this.data = data

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Returns the string representation of a RippleError.
   *
   * @returns Stringified error message.
   */
  public toString(): string {
    let result = `[${this.name}(${this.message}`
    if (this.data) {
      result += `, ${inspect(this.data)}`
    }
    result += ')]'
    return result
  }

  /**
   * Console.log in node uses util.inspect on object, and util.inspect allows
   * us to customize its output:
   * https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects.
   *
   * @returns String representation of RippleError.
   */
  public inspect(): string {
    return this.toString()
  }
}

class RippledError extends RippleError {}

class UnexpectedError extends RippleError {}

class LedgerVersionError extends RippleError {}

class ConnectionError extends RippleError {}

class NotConnectedError extends ConnectionError {}

class DisconnectedError extends ConnectionError {}

class RippledNotInitializedError extends ConnectionError {}

class TimeoutError extends ConnectionError {}

class ResponseFormatError extends ConnectionError {}

class ValidationError extends RippleError {}

class XRPLFaucetError extends RippleError {}

class NotFoundError extends RippleError {
  /**
   * Construct a NotFoundError.
   *
   * @param message - Message describing the NotFoundError with.
   */
  public constructor(message = 'Not found') {
    super(message)
  }
}

class MissingLedgerHistoryError extends RippleError {
  /**
   * Construct a MissingLedgerHistoryError.
   *
   * @param message - Message describing the MissingLedgerHistoryError.
   */
  public constructor(message?: string) {
    super(message || 'Server is missing ledger history in the specified range')
  }
}

class PendingLedgerVersionError extends RippleError {
  /**
   * Construct a PendingLedgerVersionError.
   *
   * @param message - Message describing the PendingLedgerVersionError.
   */
  public constructor(message?: string) {
    super(
      message ||
        "maxLedgerVersion is greater than server's most recent" +
          ' validated ledger'
    )
  }
}

export {
  RippleError,
  UnexpectedError,
  ConnectionError,
  RippledError,
  NotConnectedError,
  DisconnectedError,
  RippledNotInitializedError,
  TimeoutError,
  ResponseFormatError,
  ValidationError,
  NotFoundError,
  PendingLedgerVersionError,
  MissingLedgerHistoryError,
  LedgerVersionError,
  XRPLFaucetError
}
