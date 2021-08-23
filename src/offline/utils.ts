import {
  computeBinaryTransactionHash,
  computeTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountLedgerObjectID,
  computeSignerListLedgerObjectID,
  computeOfferID,
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
  xrpTimeToISO8601,
  iso8601ToXRPTime,
  isValidSecret
} from '../common/utils'

import {deriveKeypair, deriveAddress, deriveXAddress} from './derive'
import {
  generateAddressAPI,
  GenerateAddressOptions,
  GeneratedAddress
} from './generateAddress'
import computeLedgerHeaderHash from './ledgerHash'
import signPaymentChannelClaim from './signPaymentChannelClaim'
import verifyPaymentChannelClaim from './verifyPaymentChannelClaim'

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
  xrpTimeToISO8601,
  iso8601ToXRPTime,
  isValidSecret,
  computeBinaryTransactionHash,
  computeTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountLedgerObjectID,
  computeSignerListLedgerObjectID,
  computeOfferID,
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
