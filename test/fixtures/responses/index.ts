import singleCombine from './combine.json'
import generateAddress from './generate-address.json'
import generateFaucetWallet from './generate-faucet-wallet.json'
import generateXAddress from './generate-x-address.json'
import getAccountInfo from './get-account-info.json'
import getAccountObjects from './get-account-objects.json'
import getBalanceSheet from './get-balance-sheet.json'
import getBalances from './get-balances.json'
import headerByHash from './get-ledger-by-hash.json'
import fullLedger from './get-ledger-full.json'
import pre2014withPartial from './get-ledger-pre2014-with-partial.json'
import withPartial from './get-ledger-with-partial-payment.json'
import withSettingsTx from './get-ledger-with-settings-tx.json'
import withStateAsHashes from './get-ledger-with-state-as-hashes.json'
import header from './get-ledger.json'
import withXRPOrderBook from './get-orderbook-with-xrp.json'
import normalOrderBook from './get-orderbook.json'
import getOrders from './get-orders.json.json'
import sendAll from './get-paths-send-all.json'
import UsdToUsd from './get-paths-send-usd.json'
import XrpToXrp from './get-paths-xrp-to-xrp.json'
import XrpToUsd from './get-paths.json'
import fullPayChan from './get-payment-channel-full.json'
import normalPayChan from './get-payment-channel.json'
import getServerInfo from './get-server-info.json'
import getSettings from './get-settings.json'
import accountDeleteWithMemo from './get-transaction-account-delete-with-memo.json'
import accountDelete from './get-transaction-account-delete.json'
import amendment from './get-transaction-amendment.json'
import checkCancelWithMemo from './get-transaction-check-cancel-with-memo.json'
import checkCancel from './get-transaction-check-cancel.json'
import checkCashWithMemo from './get-transaction-check-cash-with-memo.json'
import checkCash from './get-transaction-check-cash.json'
import checkCreateWithMemo from './get-transaction-check-create-with-memo.json'
import checkCreate from './get-transaction-check-create.json'
import depositPreauthWithMemo from './get-transaction-deposit-preauth-with-memo.json'
import escrowCancellation from './get-transaction-escrow-cancellation.json'
import escrowCreation from './get-transaction-escrow-creation.json'
import escrowExecutionSimple from './get-transaction-escrow-execution-simple.json'
import escrowExecution from './get-transaction-escrow-execution.json'
import feeUpdateWithMemo from './get-transaction-fee-update-with-memo.json'
import feeUpdate from './get-transaction-fee-update.json'
import noMeta from './get-transaction-no-meta.json'
import notValidated from './get-transaction-not-validated.json'
import orderCancellationWithMemo from './get-transaction-order-cancellation-with-memo.json'
import orderCancellation from './get-transaction-order-cancellation.json'
import orderSell from './get-transaction-order-sell.json'
import orderWithExpirationCancellation from './get-transaction-order-with-expiration-cancellation.json'
import orderWithMemo from './get-transaction-order-with-memo.json'
import order from './get-transaction-order.json'
import paymentChannelClaimWithMemo from './get-transaction-payment-channel-claim-with-memo.json'
import paymentChannelClaim from './get-transaction-payment-channel-claim.json'
import paymentChannelCreateWithMemo from './get-transaction-payment-channel-create-with-memo.json'
import paymentChannelCreate from './get-transaction-payment-channel-create.json'
import paymentChannelFundWithMemo from './get-transaction-payment-channel-fund-with-memo.json'
import paymentChannelFund from './get-transaction-payment-channel-fund.json'
import paymentIncludeRawTransaction from './get-transaction-payment-include-raw-transaction.json'
import payment from './get-transaction-payment.json'
import setRegularKey from './get-transaction-settings-set-regular-key.json'
import trackingOff from './get-transaction-settings-tracking-off.json'
import trackingOn from './get-transaction-settings-tracking-on.json'
import settings from './get-transaction-settings.json'
import ticketCreateWithMemo from './get-transaction-ticket-create-with-memo.json'
import trustlineAddMemo from './get-transaction-trust-add-memo.json'
import trustlineNoQuality from './get-transaction-trust-no-quality.json'
import trustlineFrozenOff from './get-transaction-trust-set-frozen-off.json'
import trustline from './get-transaction-trustline-set.json'
import withMemo from './get-transaction-with-memo.json'
import withMemos from './get-transaction-with-memos.json'
import includeRawTransactions from './get-transactions-include-raw-transactions.json'
import oneTransaction from './get-transactions-one.json'
import normalTransactions from './get-transactions.json'
import allTrustlines from './get-trustlines-all.json'
import ripplingDisabledLines from './get-trustlines-rippling-disabled.json'
import filteredLines from './get-trustlines.json'
import ledgerEvent from './ledger-event.json'
import ticketCheckCancel from './prepare-check-cancel-ticket.json'
import normalCheckCancel from './prepare-check-cancel.json'
import amountCheckCash from './prepare-check-cash-amount.json'
import deliverMinCheckCash from './prepare-check-cash-delivermin.json'
import ticketCheckCash from './prepare-check-cash-ticket.json'
import fullCheckCreate from './prepare-check-create-full.json'
import ticketCheckCreate from './prepare-check-create-ticket.json'
import normalCheckCreate from './prepare-check-create.json'
import memosEscrowCancel from './prepare-escrow-cancellation-memos.json'
import ticketEscrowCancel from './prepare-escrow-cancellation-ticket.json'
import normalEscrowCancel from './prepare-escrow-cancellation.json'
import fullEscrowCreate from './prepare-escrow-creation-full.json'
import ticketEscrowCreate from './prepare-escrow-creation-ticket.json'
import normalEscrowCreate from './prepare-escrow-creation.json'
import simpleEscrowExec from './prepare-escrow-execution-simple.json'
import ticketEscrowExec from './prepare-escrow-execution-ticket.json'
import normalEscrowExec from './prepare-escrow-execution.json'
import withMemosCancel from './prepare-order-cancellation-memos.json'
import noInstructionsCancel from './prepare-order-cancellation-no-instructions.json'
import ticketCancel from './prepare-order-cancellation-ticket.json'
import normalCancel from './prepare-order-cancellation.json'
import expirationOrder from './prepare-order-expiration.json'
import sellOrder from './prepare-order-sell.json'
import ticketOrder from './prepare-order-ticket.json'
import buyOrder from './prepare-order.json'
import allOptionsPayment from './prepare-payment-all-options.json'
import signersSettings from './prepare-settings-signers.json'
import noSignerList from './prepare-settings-no-signer-list.json'
import noWeights from './prepare-settings-no-weight.json'
import normalSign from './sign.json'
import ticketSign from './sign-ticket.json'
import escrowSign from './sign-escrow.json'
import signAsSign from './sign-as.json'
import normalPayChanCreate from './prepare-payment-channel-create.json'
import ticketPayChanCreate from './prepare-payment-channel-create-ticket.json'
import fullPayChanCreate from './prepare-payment-channel-create-full.json'
import normalPayChanFund from './prepare-payment-channel-fund.json'
import ticketPayChanFund from './prepare-payment-channel-fund-ticket.json'
import fullPayChanFund from './prepare-payment-channel-fund-full.json'
import normalPayChanClaim from './prepare-payment-channel-claim.json'
import ticketPayChanClaim from './prepare-payment-channel-claim-ticket.json'
import renewPayChanClaim from './prepare-payment-channel-claim-renew.json'
import closePayChanClaim from './prepare-payment-channel-claim-close.json'
import minAmountXRPXRPPayment from './prepare-payment-min-amount-xrp-xrp.json'
import minAmountXRPPayment from './prepare-payment-min-amount-xrp.json'
import minAmountPayment from './prepare-payment-min-amount.json'
import noCounterpartyPayment from './prepare-payment-no-counterparty.json'
import ticketSequencePayment from './prepare-payment-ticket-sequence.json'
import ticketPayment from './prepare-payment-ticket.json'
import normalPayment from './prepare-payment.json'
import fieldClear from './prepare-settings-field-clear.json'
import flagClearDepositAuth from './prepare-settings-flag-clear-deposit-auth.json'
import flagClear from './prepare-settings-flag-clear.json'
import flagSetDepositAuth from './prepare-settings-flag-set-deposit-auth.json'
import flagSet from './prepare-settings-flag-set.json'
import flagsMultisign from './prepare-settings-multisign.json'
import noInstructions from './prepare-settings-no-instructions.json'
import noMaxLedgerVersion from './prepare-settings-no-maxledgerversion.json'
import regularKey from './prepare-settings-regular-key.json'
import removeRegularKey from './prepare-settings-remove-regular-key.json'
import setTransferRate from './prepare-settings-set-transfer-rate.json'
import signedSettings from './prepare-settings-signed.json'
import ticketSettings from './prepare-settings-ticket.json'
import flagsSettings from './prepare-settings.json'
import frozenTrustline from './prepare-trustline-frozen.json'
import issuedXAddressTrustline from './prepare-trustline-issuer-xaddress.json'
import simpleTrustline from './prepare-trustline-simple.json'
import ticketTrustline from './prepare-trustline-ticket.json'
import complexTrustline from './prepare-trustline.json'
import signPaymentChannelClaim from './sign-payment-channel-claim.json'
import submit from './submit.json'
import trustlineItems from './trustline-item.json'

function buildList(options) {
  return new Array(options.count).fill(options.item)
}

const getPaymentChannel = {
  normal: normalPayChan,
  full: fullPayChan
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook
}

const getPaths = {
  XrpToUsd,
  XrpToXrp,
  UsdToUsd,
  sendAll
}

const getTransaction = {
  orderCancellation,
  orderCancellationWithMemo,
  orderWithExpirationCancellation,
  order,
  orderWithMemo,
  orderSell,
  noMeta,
  payment,
  paymentIncludeRawTransaction,
  settings,
  trustline,
  trackingOn,
  trackingOff,
  setRegularKey,
  trustlineFrozenOff,
  trustlineNoQuality,
  trustlineAddMemo,
  notValidated,
  checkCreate,
  checkCreateWithMemo,
  checkCancel,
  checkCancelWithMemo,
  checkCash,
  checkCashWithMemo,
  depositPreauthWithMemo,
  escrowCreation,
  escrowCancellation,
  escrowExecution,
  escrowExecutionSimple,
  paymentChannelCreate,
  paymentChannelCreateWithMemo,
  paymentChannelFund,
  paymentChannelFundWithMemo,
  paymentChannelClaim,
  paymentChannelClaimWithMemo,
  amendment,
  feeUpdate,
  feeUpdateWithMemo,
  accountDelete,
  accountDeleteWithMemo,
  ticketCreateWithMemo,
  withMemo,
  withMemos
}

const getTransactions = {
  normal: normalTransactions,
  includeRawTransactions,
  one: oneTransaction
}

const getTrustlines = {
  filtered: filteredLines,
  moreThan400Items: buildList({
    trustlineItems,
    count: 401
  }),
  all: allTrustlines,
  ripplingDisabled: ripplingDisabledLines
}

const getLedger = {
  header,
  headerByHash,
  fullLedger,
  withSettingsTx,
  withStateAsHashes,
  withPartial,
  pre2014withPartial
}

const prepareOrder = {
  buy: buyOrder,
  ticket: ticketOrder,
  sell: sellOrder,
  expiration: expirationOrder
}

const prepareOrderCancellation = {
  normal: normalCancel,
  ticket: ticketCancel,
  withMemos: withMemosCancel,
  noInstructions: noInstructionsCancel
}

const preparePayment = {
  normal: normalPayment,
  ticket: ticketPayment,
  minAmountXRP: minAmountXRPPayment,
  minAmountXRPXRP: minAmountXRPXRPPayment,
  allOptions: allOptionsPayment,
  noCounterparty: noCounterpartyPayment,
  minAmount: minAmountPayment,
  ticketSequence: ticketSequencePayment
}

const prepareSettings = {
  regularKey,
  removeRegularKey,
  flagsSettings,
  ticketSettings,
  flagsMultisign,
  flagSet,
  flagClear,
  flagSetDepositAuth,
  flagClearDepositAuth,
  setTransferRate,
  fieldClear,
  noInstructions,
  signedSettings,
  noMaxLedgerVersion,
  signersSettings,
  noSignerList,
  noWeights
}

const prepareCheckCreate = {
  normal: normalCheckCreate,
  ticket: ticketCheckCreate,
  full: fullCheckCreate
}

const prepareCheckCash = {
  amount: amountCheckCash,
  ticket: ticketCheckCash,
  deliverMin: deliverMinCheckCash
}

const prepareCheckCancel = {
  normal: normalCheckCancel,
  ticket: ticketCheckCancel
}

const prepareEscrowCreation = {
  normal: normalEscrowCreate,
  ticketEscrowCreate,
  full: fullEscrowCreate
}

const prepareEscrowExecution = {
  normal: normalEscrowExec,
  ticket: ticketEscrowExec,
  simple: simpleEscrowExec
}

const prepareEscrowCancellation = {
  normal: normalEscrowCancel,
  ticket: ticketEscrowCancel,
  memos: memosEscrowCancel
}

const preparePaymentChannelCreate = {
  normal: normalPayChanCreate,
  ticket: ticketPayChanCreate,
  full: fullPayChanCreate
}

const preparePaymentChannelFund = {
  normal: normalPayChanFund,
  ticket: ticketPayChanFund,
  full: fullPayChanFund
}

const preparePaymentChannelClaim = {
  normal: normalPayChanClaim,
  ticket: ticketPayChanClaim,
  renew: renewPayChanClaim,
  close: closePayChanClaim
}

const prepareTrustline = {
  simple: simpleTrustline,
  ticket: ticketTrustline,
  frozen: frozenTrustline,
  issuedXAddress: issuedXAddressTrustline,
  complex: complexTrustline
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign
}

const combine = {
  single: singleCombine
}

export {}
