import BigNumber from 'bignumber.js'
import * as _ from 'lodash'

import type {Client} from '..'

import {convertKeysFromSnakeCaseToCamelCase} from './utils'

export interface GetServerInfoResponse {
  buildVersion: string
  completeLedgers: string
  hostID: string
  ioLatencyMs: number
  load?: {
    jobTypes: object[]
    threads: number
  }
  lastClose: {
    convergeTimeS: number
    proposers: number
  }
  loadFactor: number
  peers: number
  pubkeyNode: string
  pubkeyValidator?: string
  serverState: string
  validatedLedger: {
    age: number
    baseFeeXRP: string
    hash: string
    reserveBaseXRP: string
    reserveIncrementXRP: string
    ledgerVersion: number
  }
  validationQuorum: number
  networkLedger?: string
}

const DEFAULT_CUSHION = 1.2

/**
 *
 * @param object
 * @param mapping
 */
function renameKeys(
  object: Record<string, any>,
  mapping: Record<string, any>
): void {
  Object.entries(mapping).forEach((entry) => {
    const [from, to] = entry
    object[to] = object[from]
    delete object[from]
  })
}

/**
 * Make a server_info request.
 *
 * @param this - Client to make request with.
 * @returns Server info RPC response.
 */
async function getServerInfo(this: Client): Promise<GetServerInfoResponse> {
  const response = await this.request('server_info')

  const info = convertKeysFromSnakeCaseToCamelCase(response.info)

  renameKeys(info, {hostid: 'hostID'})

  if (info.validatedLedger) {
    renameKeys(info.validatedLedger, {
      baseFeeXrp: 'baseFeeXRP',
      reserveBaseXrp: 'reserveBaseXRP',
      reserveIncXrp: 'reserveIncrementXRP',
      seq: 'ledgerVersion'
    })
    info.validatedLedger.baseFeeXRP = info.validatedLedger.baseFeeXRP.toString()
    info.validatedLedger.reserveBaseXRP =
      info.validatedLedger.reserveBaseXRP.toString()
    info.validatedLedger.reserveIncrementXRP =
      info.validatedLedger.reserveIncrementXRP.toString()
  }

  return info
}

/**
 * This is a public API that can be called directly. This is not used by the
 * `prepare*` methods. See `src/transaction/utils.ts`.
 *
 * @param this - Client to make a request with.
 * @param feeCushion - Fee cushion to make request with.
 * @returns Fee.
 */
async function getFee(this: Client, feeCushion?: number): Promise<string> {
  const cushion = feeCushion || this.feeCushion || DEFAULT_CUSHION

  const serverInfo = (await this.request('server_info')).info
  const baseFeeXrp = new BigNumber(serverInfo.validated_ledger.base_fee_xrp)
  if (serverInfo.load_factor == null) {
    // https://github.com/ripple/rippled/issues/3812#issuecomment-816871100
    serverInfo.load_factor = 1
  }
  let fee = baseFeeXrp.times(serverInfo.load_factor).times(cushion)

  // Cap fee to `this._maxFeeXRP`
  fee = BigNumber.min(fee, this.maxFeeXRP)
  // Round fee to 6 decimal places
  return new BigNumber(fee.toFixed(6)).toString(10)
}

export {getServerInfo, getFee}
