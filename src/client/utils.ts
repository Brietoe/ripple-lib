import type {Client} from '..'
import * as common from '../common'
import {LedgerStream} from '../models/methods'

async function getLedgerVersion(this: Client): Promise<number> {
  return this.connection.getLedgerVersion()
}

function formatLedgerClose(ledgerClose: LedgerStream): object {
  return {
    baseFeeXRP: common.dropsToXrp(ledgerClose.fee_base),
    ledgerHash: ledgerClose.ledger_hash,
    ledgerVersion: ledgerClose.ledger_index,
    ledgerTimestamp: common.rippleTimeToISO8601(ledgerClose.ledger_time),
    reserveBaseXRP: common.dropsToXrp(ledgerClose.reserve_base),
    reserveIncrementXRP: common.dropsToXrp(ledgerClose.reserve_inc),
    transactionCount: ledgerClose.txn_count,
    validatedLedgerVersions: ledgerClose.validated_ledgers
  }
}

export {getLedgerVersion, formatLedgerClose}
