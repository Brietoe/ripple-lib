import {EventEmitter} from 'events'

import {
  classicAddressToXAddress,
  xAddressToClassicAddress,
  isValidXAddress,
  isValidClassicAddress,
  encodeSeed,
  decodeSeed,
  encodeAccountID,
  decodeAccountID,
  encodeNodePublic,
  decodeNodePublic,
  encodeAccountPublic,
  decodeAccountPublic,
  encodeXAddress,
  decodeXAddress
} from 'ripple-address-codec'

import {
  Connection,
  constants,
  errors,
  validate,
  xrpToDrops,
  dropsToXrp,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  txFlags,
  ensureClassicAddress
} from '../common'
import {ConnectionUserOptions} from '../common/connection'
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
  computeEscrowHash,
  computePaymentChannelHash
} from '../common/hashes'
import RangeSet from '../common/rangeset'
import * as schemaValidator from '../common/schema-validator'
import {getServerInfo, getFee} from '../common/serverinfo'
import {
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountLinesRequest,
  AccountLinesResponse,
  BookOffersRequest,
  BookOffersResponse,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
  LedgerRequest,
  LedgerResponse,
  LedgerDataRequest,
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
  ServerInfoRequest,
  ServerInfoResponse
} from '../common/types/commands'
import getAccountInfo from '../ledger/accountinfo'
import getAccountObjects from '../ledger/accountobjects'
import getBalanceSheet from '../ledger/balance-sheet'
import getBalances from '../ledger/balances'
import getLedger from '../ledger/ledger'
import {getOrderbook, formatBidsAndAsks} from '../ledger/orderbook'
import getOrders from '../ledger/orders'
import getPaths from '../ledger/pathfind'
import getPaymentChannel from '../ledger/payment-channel'
import {getSettings, parseAccountFlags} from '../ledger/settings'
import getTransaction from '../ledger/transaction'
import getTransactions from '../ledger/transactions'
import getTrustlines from '../ledger/trustlines'
import * as ledgerUtils from '../ledger/utils'
import {clamp, renameCounterpartyToIssuer} from '../ledger/utils'
import {deriveKeypair, deriveAddress, deriveXAddress} from '../offline/derive'
import computeLedgerHash from '../offline/ledgerhash'
import signPaymentChannelClaim from '../offline/sign-payment-channel-claim'
import {generateAddress, generateXAddress} from '../offline/utils'
import verifyPaymentChannelClaim from '../offline/verify-payment-channel-claim'
import prepareCheckCancel from '../transaction/check-cancel'
import prepareCheckCash from '../transaction/check-cash'
import prepareCheckCreate from '../transaction/check-create'
import combine from '../transaction/combine'
import prepareEscrowCancellation from '../transaction/escrow-cancellation'
import prepareEscrowCreation from '../transaction/escrow-creation'
import prepareEscrowExecution from '../transaction/escrow-execution'
import prepareOrder from '../transaction/order'
import prepareOrderCancellation from '../transaction/ordercancellation'
import preparePayment from '../transaction/payment'
import preparePaymentChannelClaim from '../transaction/payment-channel-claim'
import preparePaymentChannelCreate from '../transaction/payment-channel-create'
import preparePaymentChannelFund from '../transaction/payment-channel-fund'
import prepareSettings from '../transaction/settings'
import {sign} from '../transaction/sign'
import submit from '../transaction/submit'
import prepareTicketCreate from '../transaction/ticket'
import prepareTrustline from '../transaction/trustline'
import {TransactionJSON, Instructions, Prepare} from '../transaction/types'
import * as transactionUtils from '../transaction/utils'
import generateFaucetWallet from '../wallet/wallet-generation'

import {getLedgerVersion, formatLedgerClose} from './utils'

export interface ClientOptions extends ConnectionUserOptions {
  server?: string
  feeCushion?: number
  maxFeeXRP?: string
  proxy?: string
  timeout?: number
}

const DEFAULT_FEE_CUSHION = 1.2
const DEFAULT_MAX_XRP = '2'

/**
 * Get the response key / property name that contains the listed data for a
 * command. This varies from command to command, but we need to know it to
 * properly count across many requests.
 *
 * @param command
 */
function getCollectKeyFromCommand(command: string): string | undefined {
  switch (command) {
    case 'account_offers':
    case 'book_offers':
      return 'offers'
    case 'account_lines':
      return 'lines'
    default:
      return undefined
  }
}

class Client extends EventEmitter {
  public static renameCounterpartyToIssuer = renameCounterpartyToIssuer
  public static formatBidsAndAsks = formatBidsAndAsks

  // these are exposed only for use by unit tests; they are not part of the client.
  private static readonly PRIVATE = {
    validate,
    RangeSet,
    ledgerUtils,
    schemaValidator
  }

  private readonly feeCushion: number
  private readonly maxFeeXRP: string

  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  private readonly connection: Connection

  /**
   * Constructor for Client. Client uses a 4000 code internally to indicate a
   * manual disconnect/close. Since 4000 is a normal disconnect reason, we
   * convert this to the standard exit code 1000.
   *
   * @param options - Options to construct a Client from.
   */
  public constructor(options: ClientOptions = {}) {
    super()
    validate.apiOptions(options)
    this.feeCushion = options.feeCushion || DEFAULT_FEE_CUSHION
    this.maxFeeXRP = options.maxFeeXRP || DEFAULT_MAX_XRP
    const serverURL = options.server
    if (serverURL === null) {
      this.connection = new Connection(null, options)
      return
    }

    this.connection = new Connection(serverURL, options)
    this.connection.on('ledgerClosed', (message) => {
      this.emit('ledger', formatLedgerClose(message))
    })
    this.connection.on('error', (errorCode, errorMessage, data) => {
      this.emit('error', errorCode, errorMessage, data)
    })
    this.connection.on('connected', () => {
      this.emit('connected')
    })
    this.connection.on('disconnected', (code: number) => {
      let finalCode = code
      if (finalCode === 4000) {
        finalCode = 1000
      }
      this.emit('disconnected', finalCode)
    })
  }

  /**
   * Makes a request to the client with the given command and
   * additional request body parameters.
   */
  public async request(
    command: 'account_info',
    params: AccountInfoRequest
  ): Promise<AccountInfoResponse>
  public async request(
    command: 'account_lines',
    params: AccountLinesRequest
  ): Promise<AccountLinesResponse>
  public async request(
    command: 'account_objects',
    params: AccountObjectsRequest
  ): Promise<AccountObjectsResponse>
  public async request(
    command: 'account_offers',
    params: AccountOffersRequest
  ): Promise<AccountOffersResponse>
  public async request(
    command: 'book_offers',
    params: BookOffersRequest
  ): Promise<BookOffersResponse>
  public async request(
    command: 'gateway_balances',
    params: GatewayBalancesRequest
  ): Promise<GatewayBalancesResponse>
  public async request(
    command: 'ledger',
    params: LedgerRequest
  ): Promise<LedgerResponse>
  public async request(
    command: 'ledger_data',
    params?: LedgerDataRequest
  ): Promise<LedgerDataResponse>
  public async request(
    command: 'ledger_entry',
    params: LedgerEntryRequest
  ): Promise<LedgerEntryResponse>
  public async request(
    command: 'server_info',
    params?: ServerInfoRequest
  ): Promise<ServerInfoResponse>
  public async request<Request, Response>(
    command: string,
    params: Request
  ): Promise<Response>

  /**
   * Makes a request to rippled.
   *
   * @param command - Rippled command.
   * @param params - Params for given command.
   * @returns Rippled response.
   */
  public async request<Request, Response>(
    command: string,
    params: Request
  ): Promise<Response> {
    const response: Response = this.connection.request({
      ...params,
      command,
      account: params.account ? ensureClassicAddress(params.account) : undefined
    })

    return response
  }

  /**
   * Returns true if there are more pages of data. When there are more results
   * than contained in the response, the response includes a `marker` field.
   *
   * See https://ripple.com/build/rippled-apis/#markers-and-pagination.
   *
   * @param currentResponse - Current response from rippled.
   * @returns True if client can fetch another page.
   */
  public hasNextPage<T extends {marker?: string}>(currentResponse: T): boolean {
    return Boolean(currentResponse.marker)
  }

  /**
   * Request the next page from rippled.
   *
   * @param command - String command for request being made.
   * @param params - Params for request being made.
   * @param previousResponse - Previous response.
   * @returns Next response.
   */
  public async requestNextPage<T extends {marker?: string}>(
    command: string,
    params: Record<string, string>,
    previousResponse: T
  ): Promise<T> {
    if (!previousResponse.marker) {
      return Promise.reject(
        new errors.NotFoundError('response does not have a next page')
      )
    }
    const nextPageParams = {...params, marker: previousResponse.marker}
    return this.request(command, nextPageParams)
  }

  /**
   * Prepare a transaction.
   *
   * You can later submit the transaction with a `submit` request.
   *
   * @param txJSON
   * @param instructions
   */
  async prepareTransaction(
    txJSON: TransactionJSON,
    instructions: Instructions = {}
  ): Promise<Prepare> {
    return transactionUtils.prepareTransaction(txJSON, this, instructions)
  }

  /**
   * Convert a string to hex.
   *
   * This can be used to generate `MemoData`, `MemoType`, and `MemoFormat`.
   *
   * @param string - String to convert to hex.
   */
  convertStringToHex(string: string): string {
    return transactionUtils.convertStringToHex(string)
  }

  /**
   * Makes multiple paged requests to the client to return a given number of
   * resources. _requestAll() will make multiple requests until the `limit`
   * number of resources is reached (if no `limit` is provided, a single request
   * will be made).
   *
   * If the command is unknown, an additional `collect` property is required to
   * know which response key contains the array of resources.
   *
   * NOTE: This command is used by existing methods and is not recommended for
   * general use. Instead, use rippled's built-in pagination and make multiple
   * requests as needed.
   */
  async _requestAll(
    command: 'account_offers',
    params: AccountOffersRequest
  ): Promise<AccountOffersResponse[]>
  async _requestAll(
    command: 'book_offers',
    params: BookOffersRequest
  ): Promise<BookOffersResponse[]>
  async _requestAll(
    command: 'account_lines',
    params: AccountLinesRequest
  ): Promise<AccountLinesResponse[]>
  async _requestAll(
    command: string,
    params: any = {},
    options: {collect?: string} = {}
  ): Promise<any[]> {
    // The data under collection is keyed based on the command. Fail if command
    // not recognized and collection key not provided.
    const collectKey = options.collect || getCollectKeyFromCommand(command)
    if (!collectKey) {
      throw new errors.ValidationError(`no collect key for command ${command}`)
    }
    // If limit is not provided, fetches all data over multiple requests.
    // NOTE: This may return much more than needed. Set limit when possible.
    const countTo: number = params.limit != null ? params.limit : Infinity
    let count = 0
    let marker: string = params.marker
    let lastBatchLength: number
    const results = []
    do {
      const countRemaining = clamp(countTo - count, 10, 400)
      const repeatProps = {
        ...params,
        limit: countRemaining,
        marker
      }
      const singleResult = await this.request(command, repeatProps)
      const collectedData = singleResult[collectKey]
      marker = singleResult.marker
      results.push(singleResult)
      // Make sure we handle when no data (not even an empty array) is returned.
      const isExpectedFormat = Array.isArray(collectedData)
      if (isExpectedFormat) {
        count += collectedData.length
        lastBatchLength = collectedData.length
      } else {
        lastBatchLength = 0
      }
    } while (Boolean(marker) && count < countTo && lastBatchLength !== 0)
    return results
  }

  // @deprecated Use X-addresses instead & Invoke from top-level package instead
  generateAddress = generateAddress
  generateXAddress = generateXAddress // @deprecated Invoke from top-level package instead

  isConnected(): boolean {
    return this.connection.isConnected()
  }

  async connect(): Promise<void> {
    return this.connection.connect()
  }

  async disconnect(): Promise<void> {
    // backwards compatibility: connection.disconnect() can return a number, but
    // this method returns nothing. SO we await but don't return any result.
    await this.connection.disconnect()
  }

  getServerInfo = getServerInfo
  getFee = getFee
  getLedgerVersion = getLedgerVersion

  getTransaction = getTransaction
  getTransactions = getTransactions
  getTrustlines = getTrustlines
  getBalances = getBalances
  getBalanceSheet = getBalanceSheet
  getPaths = getPaths
  getOrderbook = getOrderbook
  getOrders = getOrders
  getSettings = getSettings
  getAccountInfo = getAccountInfo
  getAccountObjects = getAccountObjects
  getPaymentChannel = getPaymentChannel
  getLedger = getLedger
  parseAccountFlags = parseAccountFlags

  preparePayment = preparePayment
  prepareTrustline = prepareTrustline
  prepareOrder = prepareOrder
  prepareOrderCancellation = prepareOrderCancellation
  prepareEscrowCreation = prepareEscrowCreation
  prepareEscrowExecution = prepareEscrowExecution
  prepareEscrowCancellation = prepareEscrowCancellation
  preparePaymentChannelCreate = preparePaymentChannelCreate
  preparePaymentChannelFund = preparePaymentChannelFund
  preparePaymentChannelClaim = preparePaymentChannelClaim
  prepareCheckCreate = prepareCheckCreate
  prepareCheckCash = prepareCheckCash
  prepareCheckCancel = prepareCheckCancel
  prepareTicketCreate = prepareTicketCreate
  prepareSettings = prepareSettings
  sign = sign
  combine = combine

  submit = submit // @deprecated Use client.request('submit', { tx_blob: signedTransaction }) instead

  deriveKeypair = deriveKeypair // @deprecated Invoke from top-level package instead
  deriveAddress = deriveAddress // @deprecated Invoke from top-level package instead
  computeLedgerHash = computeLedgerHash // @deprecated Invoke from top-level package instead
  signPaymentChannelClaim = signPaymentChannelClaim // @deprecated Invoke from top-level package instead
  verifyPaymentChannelClaim = verifyPaymentChannelClaim // @deprecated Invoke from top-level package instead

  generateFaucetWallet = generateFaucetWallet

  errors = errors

  static deriveXAddress = deriveXAddress

  // Client.deriveClassicAddress (static) is a new name for client.deriveAddress
  static deriveClassicAddress = deriveAddress

  /**
   * Static methods to expose ripple-address-codec methods.
   */
  static classicAddressToXAddress = classicAddressToXAddress
  static xAddressToClassicAddress = xAddressToClassicAddress
  static isValidXAddress = isValidXAddress
  static isValidClassicAddress = isValidClassicAddress
  static encodeSeed = encodeSeed
  static decodeSeed = decodeSeed
  static encodeAccountID = encodeAccountID
  static decodeAccountID = decodeAccountID
  static encodeNodePublic = encodeNodePublic
  static decodeNodePublic = decodeNodePublic
  static encodeAccountPublic = encodeAccountPublic
  static decodeAccountPublic = decodeAccountPublic
  static encodeXAddress = encodeXAddress
  static decodeXAddress = decodeXAddress

  /**
   * Static methods that replace functionality from the now-deprecated ripple-hashes library.
   */
  // Compute the hash of a binary transaction blob.
  // @deprecated Invoke from top-level package instead
  static computeBinaryTransactionHash = computeBinaryTransactionHash // (txBlobHex: string): string
  // Compute the hash of a transaction in txJSON format.
  // @deprecated Invoke from top-level package instead
  static computeTransactionHash = computeTransactionHash // (txJSON: any): string
  // @deprecated Invoke from top-level package instead
  static computeBinaryTransactionSigningHash =
    computeBinaryTransactionSigningHash // (txBlobHex: string): string

  // Compute the hash of an account, given the account's classic address (starting with `r`).
  // @deprecated Invoke from top-level package instead
  static computeAccountLedgerObjectID = computeAccountLedgerObjectID // (address: string): string
  // Compute the hash (ID) of an account's SignerList.
  // @deprecated Invoke from top-level package instead
  static computeSignerListLedgerObjectID = computeSignerListLedgerObjectID // (address: string): string
  // Compute the hash of an order, given the owner's classic address (starting with `r`) and the account sequence number of the `OfferCreate` order transaction.
  // @deprecated Invoke from top-level package instead
  static computeOrderID = computeOrderID // (address: string, sequence: number): string
  // Compute the hash of a trustline, given the two parties' classic addresses (starting with `r`) and the currency code.
  // @deprecated Invoke from top-level package instead
  static computeTrustlineHash = computeTrustlineHash // (address1: string, address2: string, currency: string): string
  // @deprecated Invoke from top-level package instead
  static computeTransactionTreeHash = computeTransactionTreeHash // (transactions: any[]): string
  // @deprecated Invoke from top-level package instead
  static computeStateTreeHash = computeStateTreeHash // (entries: any[]): string
  // Compute the hash of a ledger.
  // @deprecated Invoke from top-level package instead
  static computeLedgerHash = computeLedgerHash // (ledgerHeader): string
  // Compute the hash of an escrow, given the owner's classic address (starting with `r`) and the account sequence number of the `EscrowCreate` escrow transaction.
  // @deprecated Invoke from top-level package instead
  static computeEscrowHash = computeEscrowHash // (address, sequence): string
  // Compute the hash of a payment channel, given the owner's classic address (starting with `r`), the classic address of the destination, and the account sequence number of the `PaymentChannelCreate` payment channel transaction.
  // @deprecated Invoke from top-level package instead
  static computePaymentChannelHash = computePaymentChannelHash // (address, dstAddress, sequence): string

  xrpToDrops = xrpToDrops // @deprecated Invoke from top-level package instead
  dropsToXrp = dropsToXrp // @deprecated Invoke from top-level package instead
  rippleTimeToISO8601 = rippleTimeToISO8601 // @deprecated Invoke from top-level package instead
  iso8601ToRippleTime = iso8601ToRippleTime // @deprecated Invoke from top-level package instead
  txFlags = txFlags
  static accountSetFlags = constants.AccountSetFlags

  isValidAddress = schemaValidator.isValidAddress
  isValidSecret = schemaValidator.isValidSecret
}

export {Client}

export type {
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountLinesRequest,
  AccountLinesResponse,
  BookOffersRequest,
  BookOffersResponse,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
  LedgerRequest,
  LedgerResponse,
  LedgerDataRequest,
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
  ServerInfoRequest,
  ServerInfoResponse
}
