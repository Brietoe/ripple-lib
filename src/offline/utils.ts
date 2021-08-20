import {
  computeBinaryTransactionHash,
  computeTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountLedgerObjectID,
  computeSignerListLedgerObjectID,
  computeOrderID,
  computeTrustlineHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
  computeLedgerHash,
  computeEscrowHash,
  computePaymentChannelHash
} from '../common/hashes'
import {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  isValidSecret
} from '../common/utils'

import {deriveKeypair, deriveAddress, deriveXAddress} from './derive'
import {
  generateAddressAPI,
  GenerateAddressOptions,
  GeneratedAddress
} from './generate-address'
import computeLedgerHeaderHash from './ledgerhash'
import signPaymentChannelClaim from './sign-payment-channel-claim'
import verifyPaymentChannelClaim from './verify-payment-channel-claim'

// @deprecated Use X-addresses instead
const generateAddress = (
  options: GenerateAddressOptions = {}
): GeneratedAddress =>
  generateAddressAPI({...options, includeClassicAddress: true})

export {
  computeLedgerHeaderHash,
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  isValidSecret,
  computeBinaryTransactionHash,
  computeTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountLedgerObjectID,
  computeSignerListLedgerObjectID,
  computeOrderID,
  computeTrustlineHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
  computeLedgerHash,
  computeEscrowHash,
  computePaymentChannelHash,
  generateAddress,
  generateAddressAPI as generateXAddress,
  deriveKeypair,
  deriveAddress,
  deriveXAddress,
  signPaymentChannelClaim,
  verifyPaymentChannelClaim
}
