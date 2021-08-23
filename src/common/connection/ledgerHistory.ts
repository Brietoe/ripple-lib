import {LedgerStream} from '../../models/methods'
import RangeSet from '../rangeSet'

/**
 * LedgerHistory is used to store and reference ledger information that has been
 * captured by the Connection class over time.
 */
class LedgerHistory {
  public feeBase: null | number = null
  public feeRef: null | number = null
  public latestVersion: null | number = null
  public reserveBase: null | number = null
  private readonly availableVersions = new RangeSet()

  /**
   * Check if a ledger index is in a clients ledger history.
   *
   * @param index - Index to check.
   * @returns True if the given version exists.
   */
  public hasLedgerIndex(index: number): boolean {
    return this.availableVersions.containsValue(index)
  }

  /**
   * Check if a RangeSet contains a range of ledger.
   *
   * @param lowIndex - Lowest index in range.
   * @param highIndex - Highest index in range.
   * @returns True if the given range of versions exist (inclusive).
   */
  public hasLedgerRange(lowIndex: number, highIndex: number): boolean {
    return this.availableVersions.containsRange(lowIndex, highIndex)
  }

  /**
   * Update LedgerHistory with a new ledger response object. The "responseData"
   * format lets you pass in any valid rippled ledger response data, regardless
   * of whether ledger history data exists or not. If relevant ledger data
   * is found, we'll update our history (ex: from a "ledgerClosed" event).
   *
   * @param ledgerMessage - Message from the ledger subscription stream.
   */
  public update(ledgerMessage: LedgerStream): void {
    // type: ignored
    this.feeBase = ledgerMessage.fee_base
    this.feeRef = ledgerMessage.fee_ref
    // ledger_hash: ignored
    this.latestVersion = ledgerMessage.ledger_index
    // ledger_time: ignored
    this.reserveBase = ledgerMessage.reserve_base
    // reserve_inc: ignored (may be useful for advanced use cases)
    // txn_count: ignored
    if (ledgerMessage.validated_ledgers) {
      this.availableVersions.reset()
      this.availableVersions.parseAndAddRanges(ledgerMessage.validated_ledgers)
    } else {
      this.availableVersions.addValue(this.latestVersion)
    }
  }
}

export default LedgerHistory
