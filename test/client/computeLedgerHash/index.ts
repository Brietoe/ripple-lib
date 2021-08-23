import {expect, assert} from 'chai'

import type {Client} from '../../../src'
import {ValidationError} from '../../../src/common/errors'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import type {TestSuite} from '../../utils'

const REQUEST_FIXTURES = requests.setDomain

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'given corrupt data - should fail': async (client: Client, _address) => {
    const request = {
      includeTransactions: true,
      includeState: true,
      includeAllData: true,
      ledgerVersion: 38129
    }

    const ledger = await client.getLedger(request)

    // @ts-expect-error
    let {rawTransaction} = ledger.transactions[0]

    expect(rawTransaction).to.equal(
      '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"10000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","meta":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}'
    )
    rawTransaction =
      '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"12000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","meta":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}'

    ledger.parentCloseTime = ledger.closeTime

    assert.throws(
      () => client.computeLedgerHash(ledger, {computeTreeHashes: true}),
      ValidationError,
      'transactionHash in header does not match computed hash of transactions'
    )
  },

  'given ledger without raw transactions - should throw': async (
    client: Client,
    _address
  ) => {
    const request = {
      includeTransactions: true,
      includeState: true,
      includeAllData: true,
      ledgerVersion: 38129
    }

    const ledger = await client.getLedger(request)

    // @ts-expect-error
    const {rawTransaction} = ledger.transactions[0]

    expect(rawTransaction).to.equal(
      '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"10000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","meta":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}'
    )

    // Delete rawTransaction
    // @ts-expect-error - Delete rawTransaction
    delete ledger.transactions[0].rawTransaction
    ledger.parentCloseTime = ledger.closeTime

    assert.throws(
      () => client.computeLedgerHash(ledger, {computeTreeHashes: true}),
      ValidationError,
      'ledger is missing raw transactions'
    )
  },

  'given ledger without state or transactions - only compute ledger hash':
    async (client, _address) => {
      const request = {
        includeTransactions: true,
        includeState: true,
        includeAllData: true,
        ledgerVersion: 38129
      }
      const ledger = await client.getLedger(request)
      assert.strictEqual(
        // @ts-expect-error
        ledger.transactions[0].rawTransaction,
        '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"10000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","meta":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}'
      )
      ledger.parentCloseTime = ledger.closeTime
      const computeLedgerHash = client.computeLedgerHash
      const ValidationError = client.errors.ValidationError
      function testCompute(ledger, expectedError) {
        let hash = computeLedgerHash(ledger)
        assert.strictEqual(
          hash,
          'E6DB7365949BF9814D76BCC730B01818EB9136A89DB224F3F9F5AAE4569D758E'
        )
        // fail if required to compute tree hashes
        try {
          hash = computeLedgerHash(ledger, {computeTreeHashes: true})
        } catch (error) {
          assert(error instanceof ValidationError)
          assert.strictEqual(error.message, expectedError)
          return
        }
        assert(
          false,
          `Should throw ValidationError instead of producing hash: ${hash}`
        )
      }

      const transactions = ledger.transactions
      delete ledger.transactions
      testCompute(ledger, 'transactions property is missing from the ledger')
      delete ledger.rawState
      testCompute(ledger, 'transactions property is missing from the ledger')
      ledger.transactions = transactions
      testCompute(ledger, 'rawState property is missing from the ledger')
    },

  'wrong hash': async (client, address) => {
    const request = {
      includeTransactions: true,
      includeState: true,
      includeAllData: true,
      ledgerVersion: 38129
    }
    const ledger = await client.getLedger(request)
    assertResultMatch(ledger, responses.getLedger.full, 'getLedger')
    const newLedger = {
      ...ledger,
      parentCloseTime: ledger.closeTime,
      stateHash:
        'D9ABF622DA26EEEE48203085D4BC23B0F77DC6F8724AC33D975DA3CA492D2E44'
    }
    assert.throws(() => {
      client.computeLedgerHash(newLedger)
    }, /does not match computed hash of state/)
  },

  'computeLedgerHash': async (client, address) => {
    // const client = new Client()
    const header = REQUEST_FIXTURES.header
    const ledgerHash = client.computeLedgerHash(header)
    assert.strictEqual(
      ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349'
    )
  },

  'computeLedgerHash - with transactions': async (client, address) => {
    // const client = new Client()
    const header = {
      ...REQUEST_FIXTURES.header,
      transactionHash: undefined,
      rawTransactions: JSON.stringify(REQUEST_FIXTURES.transactions)
    }
    const ledgerHash = client.computeLedgerHash(header)
    assert.strictEqual(
      ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349'
    )
  },

  'computeLedgerHash - incorrent transaction_hash': async (client, address) => {
    // const client = new Client()
    const header = {
      ...REQUEST_FIXTURES.header,
      transactionHash:
        '325EACC5271322539EEEC2D6A5292471EF1B3E72AE7180533EFC3B8F0AD435C9'
    }
    header.rawTransactions = JSON.stringify(REQUEST_FIXTURES.transactions)
    assert.throws(() => client.computeLedgerHash(header))
  }
}

export default tests
