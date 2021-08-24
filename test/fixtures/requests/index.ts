import setDomain from './combine.json'
import transactions from './compute-ledger-hash-transactions.json'
import header from './compute-ledger-hash.json'
import withXRPOrderBook from './get-orderbook-with-xrp.json'
import normalOrderBook from './get-orderbook.json'
import invalid from './getpaths/invalid.json'
import issuer from './getpaths/issuer.json'
import NoPathsSource from './getpaths/no-paths-source-amount.json'
import NoPathsWithCurrencies from './getpaths/no-paths-with-currencies.json'
import NoPaths from './getpaths/no-paths.json'
import normalPaths from './getpaths/normal.json'
import NotAcceptCurrency from './getpaths/not-accept-currency.json'
import sendAll from './getpaths/send-all.json'
import UsdToUsd from './getpaths/usd2usd.json'
import XrpToXrpNotEnough from './getpaths/xrp2xrp-not-enough.json'
import XrpToXrp from './getpaths/xrp2xrp.json'
import normalCheckCancel from './prepare-check-cancel.json'
import amountCheckCash from './prepare-check-cash-amount.json'
import deliverMinCheckCash from './prepare-check-cash-delivermin.json'
import fullCheckCreate from './prepare-check-create-full.json'
import normalCheckCreate from './prepare-check-create.json'
import memosEscrowCancel from './prepare-escrow-cancellation-memos.json'
import normalEscrowCancel from './prepare-escrow-cancellation.json'
import fullEscrowCreate from './prepare-escrow-creation-full.json'
import normalEscrowCreate from './prepare-escrow-creation.json'
import noConditionEscrowExec from './prepare-escrow-execution-no-condition.json'
import noFulfillmentEscrowExec from './prepare-escrow-execution-no-fulfillment.json'
import simpleEscrowExec from './prepare-escrow-execution-simple.json'
import normalEscrowExec from './prepare-escrow-execution.json'
import withMemosCancel from './prepare-order-cancellation-memos.json'
import simpleCancel from './prepare-order-cancellation.json'
import expirationOrder from './prepare-order-expiration.json'
import sellOrder from './prepare-order-sell.json'
import buyOrder from './prepare-order.json'
import allOptions from './prepare-payment-all-options.json'
import closePayChanClaim from './prepare-payment-channel-claim-close.json'
import fullPayChanClaim from './prepare-payment-channel-claim-full.json'
import noSignaturePayChanClaim from './prepare-payment-channel-claim-no-signature.json'
import renewPayChanClaim from './prepare-payment-channel-claim-renew.json'
import normalPayChanClaim from './prepare-payment-channel-claim.json'
import fullPayChanCreate from './prepare-payment-channel-create-full.json'
import normalPayChanCreate from './prepare-payment-channel-create.json'
import fullPayChanFund from './prepare-payment-channel-fund-full.json'
import normalPayChanFund from './prepare-payment-channel-fund.json'
import minAmountXRP from './prepare-payment-min-xrp.json'
import minAmount from './prepare-payment-min.json'
import noCounterparty from './prepare-payment-no-counterparty.json'
import wrongAddress from './prepare-payment-wrong-address.json'
import wrongAmount from './prepare-payment-wrong-amount.json'
import wrongPartial from './prepare-payment-wrong-partial.json'
import normalPayment from './prepare-payment.json'
import noSignerEntries from './prepare-settings-no-signer-entries.json'
import noThresholdSigners from './prepare-settings-signers-no-threshold.json'
import noWeightsSigners from './prepare-settings-signers-no-weights.json'
import normalSigners from './prepare-settings-signers.json'
import domain from './prepare-settings.json'
import frozenTrustline from './prepare-trustline-frozen.json'
import issuedXAddressTrustline from './prepare-trustline-issuer-xaddress.json'
import simpleTrustline from './prepare-trustline-simple.json'
import complexTrustline from './prepare-trustline.json'
import signAsSign from './sign-as.json'
import escrowSign from './sign-escrow.json'
import signPaymentChannelClaim from './sign-payment-channel-claim.json'
import ticketSign from './sign-ticket.json'
import normalSign from './sign.json'

const prepareOrder = {
  buy: buyOrder,
  sell: sellOrder,
  expiration: expirationOrder
}

const prepareOrderCancellation = {
  simple: simpleCancel,
  withMemos: withMemosCancel
}

const preparePayment = {
  normal: normalPayment,
  minAmountXRP,
  minAmount,
  wrongAddress,
  wrongAmount,
  wrongPartial,
  allOptions,
  noCounterparty
}

const prepareSettings = {
  domain,
  noSignerEntries,
  signers = {
    normal: normalSigners,
    noThreshold: noThresholdSigners,
    noWeights: noWeightsSigners
  }
}
const prepareEscrowCreation = {
  normal: normalEscrowCreate,
  full: fullEscrowCreate
}

const prepareEscrowExecution = {
  normal: normalEscrowExec,
  simple: simpleEscrowExec,
  noCondition: noConditionEscrowExec,
  noFulfillment: noFulfillmentEscrowExec
}

const prepareEscrowCancellation = {
  normal: normalEscrowCancel,
  memos: memosEscrowCancel
}

const prepareCheckCreate = {
  normal: normalCheckCreate,
  full: fullCheckCreate
}

const prepareCheckCash = {
  amount: amountCheckCash,
  deliverMin: deliverMinCheckCash
}

const prepareCheckCancel = {
  normal: normalCheckCancel
}

const preparePaymentChannelCreate = {
  normal: normalPayChanCreate,
  full: fullPayChanCreate
}

const preparePaymentChannelFund = {
  normal: normalPayChanFund,
  full: fullPayChanFund
}

const preparePaymentChannelClaim = {
  normal: normalPayChanClaim,
  full: fullPayChanClaim,
  close: closePayChanClaim,
  renew: renewPayChanClaim,
  noSignature: noSignaturePayChanClaim
}

const prepareTrustline = {
  simple: simpleTrustline,
  complex: complexTrustline,
  frozen: frozenTrustline,
  issuedXAddress: issuedXAddressTrustline
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign
}

const getPaths = {
  normal: normalPaths,
  UsdToUsd,
  XrpToXrp,
  XrpToXrpNotEnough,
  NotAcceptCurrency,
  NoPaths,
  NoPathsSource,
  NoPathsWithCurrencies,
  sendAll,
  invalid,
  issuer
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook
}

const computeLedgerHash = {
  header,
  transactions
}

const combine = {
  setDomain
}

const requests = {
  combine,
  computeLedgerHash,
  getOrderbook,
  getPaths,
  prepareCheckCash,
  prepareCheckCancel,
  prepareCheckCreate,
  prepareEscrowCancellation,
  prepareEscrowCreation,
  prepareEscrowExecution,
  prepareOrder,
  prepareOrderCancellation,
  preparePayment,
  preparePaymentChannelClaim,
  preparePaymentChannelCreate,
  preparePaymentChannelFund,
  prepareTrustline,
  prepareSettings,
  sign,
  signPaymentChannelClaim
}

export default requests
