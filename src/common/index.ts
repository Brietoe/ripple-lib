import {xAddressToClassicAddress, isValidXAddress} from 'ripple-address-codec'

import Connection from './connection'
import * as constants from './constants'
import * as errors from './errors'

/**
 * Ensure account is a classic address.
 *
 * @param account - Account to ensure is a classic address.
 * @returns A classic Address.
 * @throws When X-Address has a tag.
 */
function ensureClassicAddress(account: string): string {
  if (isValidXAddress(account)) {
    const {classicAddress, tag} = xAddressToClassicAddress(account)

    // Except for special cases, X-addresses used for requests
    // must not have an embedded tag. In other words,
    // `tag` should be `false`.
    if (tag !== false) {
      throw new Error(
        'This command does not support the use of a tag. Use an address without a tag.'
      )
    }

    // For rippled requests that use an account, always use a classic address.
    return classicAddress
  }
  return account
}

export {ensureClassicAddress, Connection, constants, errors}
export {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  removeUndefined,
  convertKeysFromSnakeCaseToCamelCase,
  iso8601ToXRPTime,
  xrpTimeToISO8601
} from './utils'
export {txFlags} from './txFlags'
