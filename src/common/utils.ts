import BigNumber from 'bignumber.js'
import {xAddressToClassicAddress} from 'ripple-address-codec'
import {deriveKeypair} from 'ripple-keypairs'

import {Amount} from '../models/common'

import {ValidationError} from './errors'

const XRP_TO_UNIX_DIFF = 0x386d4380

/**
 * Check if secret is valid.
 *
 * @param secret - Secret to test.
 * @returns True if secret is valid.
 */
function isValidSecret(secret: string): boolean {
  try {
    deriveKeypair(secret)
    return true
  } catch (_err) {
    return false
  }
}

/**
 * Converts Drops to XRP.
 *
 * @param drops - Number of drops.
 * @returns Amount in XRP.
 * @throws When drops is invalid.
 */
function dropsToXrp(drops: BigNumber.Value): string {
  if (typeof drops === 'string') {
    if (!drops.match(/^-?[0-9]*\.?[0-9]*$/)) {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`
      )
    } else if (drops === '.') {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a BigNumber or string-encoded number.`
      )
    }
  }

  // Converting to BigNumber and then back to string should remove any
  // decimal point followed by zeros, e.g. '1.00'.
  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  drops = new BigNumber(drops).toString(10)

  // drops are only whole units
  if (drops.includes('.')) {
    throw new ValidationError(
      `dropsToXrp: value '${drops}' has` + ` too many decimal places.`
    )
  }

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!drops.match(/^-?[0-9]+$/)) {
    throw new ValidationError(
      `dropsToXrp: failed sanity check -` +
        ` value '${drops}',` +
        ` does not match (^-?[0-9]+$).`
    )
  }

  return new BigNumber(drops).dividedBy(1000000.0).toString(10)
}

/**
 * Converts XRP Amount to drops.
 *
 * @param xrp - XRP to convert to drops.
 * @returns Amount in drops.
 */
function xrpToDrops(xrp: BigNumber.Value): string {
  if (typeof xrp === 'string') {
    if (!xrp.match(/^-?[0-9]*\.?[0-9]*$/)) {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`
      )
    } else if (xrp === '.') {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}',` +
          ` should be a BigNumber or string-encoded number.`
      )
    }
  }

  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  xrp = new BigNumber(xrp).toString(10)

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!xrp.match(/^-?[0-9.]+$/)) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}',` +
        ` does not match (^-?[0-9.]+$).`
    )
  }

  const components = xrp.split('.')
  if (components.length > 2) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}' has` +
        ` too many decimal points.`
    )
  }

  const fraction = components[1] || '0'
  if (fraction.length > 6) {
    throw new ValidationError(
      `xrpToDrops: value '${xrp}' has` + ` too many decimal places.`
    )
  }

  return new BigNumber(xrp)
    .times(1000000.0)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toString(10)
}

function toRippledAmount(amount: Amount): Amount {
  if (typeof amount === 'string') {
    return amount
  }

  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value)
  }
  if (amount.currency === 'drops') {
    return amount.value
  }

  let issuer = amount.counterparty || amount.issuer
  let tag: number | false = false

  try {
    ;({classicAddress: issuer, tag} = xAddressToClassicAddress(issuer))
  } catch (e) {
    /* not an X-address */
  }

  if (tag !== false) {
    throw new ValidationError('Issuer X-address includes a tag')
  }

  return {
    currency: amount.currency,
    issuer,
    value: amount.value
  }
}

function convertKeysFromSnakeCaseToCamelCase(obj: any): any {
  if (typeof obj === 'object') {
    const accumulator = Array.isArray(obj) ? [] : {}
    let newKey
    return Object.entries(obj).reduce((result, [key, value]) => {
      newKey = key
      // taking this out of function leads to error in PhantomJS
      const FINDSNAKE = /([a-zA-Z]_[a-zA-Z])/g
      if (FINDSNAKE.test(key)) {
        newKey = key.replace(FINDSNAKE, (r) => r[0] + r[2].toUpperCase())
      }
      result[newKey] = convertKeysFromSnakeCaseToCamelCase(value)
      return result
    }, accumulator)
  }
  return obj
}

/**
 * Remove undefined values from an object.
 *
 * @param obj - Object to remove undefined.
 * @returns Object without Undefined values.
 */
function removeUndefined(
  obj: Record<string, undefined | unknown>
): Record<string, unknown> {
  const newObj = {...obj}

  Object.entries(obj).forEach(([key, val]) => {
    if (val == null) {
      delete newObj[key]
    }
  })

  return newObj
}

/**
 * Convert a XRP timestamp to a Unix Timestamp.
 *
 * @param xrpepoch - (seconds since 1/1/2000 GMT).
 * @returns Ms since unix epoch.
 */
function xrpToUnixTimestamp(xrpepoch: number): number {
  return (xrpepoch + XRP_TO_UNIX_DIFF) * 1000
}

/**
 * Converts a unix timestamp to an XRP timestamp.
 *
 * @param timestamp - (ms since unix epoch).
 * @returns Seconds since ripple epoch (1/1/2000 GMT).
 */
function unixToXRPTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - XRP_TO_UNIX_DIFF
}

/**
 * Converts seconds since XRP epoch to ISO8601 format.
 *
 * @param xrpTime - XRP time to convert to ISO8601.
 * @returns XRP timestamp in ISO8601 form.
 */
function xrpTimeToISO8601(xrpTime: number): string {
  return new Date(xrpToUnixTimestamp(xrpTime)).toISOString()
}

/**
 * Convert an iso8601 timestamp to XRP time.
 *
 * @param iso8601 - International standard date format.
 * @returns Seconds since XRP epoch (1/1/2000 GMT).
 */
function iso8601ToXRPTime(iso8601: string): number {
  return unixToXRPTimestamp(Date.parse(iso8601))
}

export {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  xrpTimeToISO8601,
  iso8601ToXRPTime,
  isValidSecret
}
