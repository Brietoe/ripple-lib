import {assert} from 'chai'

import {ValidationError} from 'xrpl-local/common/errors'

import {
  BaseTransaction,
  verifyBaseTransaction
} from '../../src/models/transactions/common'

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Transaction Verification', function () {
  let txJson: BaseTransaction

  beforeEach(function () {
    txJson = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment',
      Fee: '12',
      Sequence: 100,
      AccountTxnID: 'DEADBEEF',
      Flags: 15,
      LastLedgerSequence: 1383,
      Memos: [
        {
          Memo: {
            MemoType:
              '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
            MemoData: '72656e74'
          }
        },
        {
          Memo: {
            MemoFormat:
              '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
            MemoData: '72656e74'
          }
        },
        {
          Memo: {
            MemoType: '72656e74'
          }
        }
      ],
      Signers: [
        {
          Account: 'r....',
          TxnSignature: 'DEADBEEF',
          SigningPubKey: 'hex-string'
        }
      ],
      SourceTag: 31,
      SigningPubKey:
        '03680DD274EE55594F7244F489CD38CF3A5A1A4657122FB8143E185B2BA043DF36',
      TicketSequence: 10,
      TxnSignature:
        '3045022100C6708538AE5A697895937C758E99A595B57A16393F370F11B8D4C032E80B532002207776A8E85BB9FAF460A92113B9C60F170CD964196B1F084E0DAB65BAEC368B66'
    }
  })

  it(`Verifies all optional BaseTransaction`, function () {
    assert.doesNotThrow(() => verifyBaseTransaction(txJson))
  })

  it(`Verifies only required BaseTransaction`, function () {
    const onlyRequired: BaseTransaction = {
      Account: 'r97KeayHuEsDwyU1yPBVtMLLoQr79QcRFe',
      TransactionType: 'Payment'
    }

    assert.doesNotThrow(() => verifyBaseTransaction(onlyRequired))
  })

  it(`Handles invalid Fee`, function () {
    txJson.Fee = 1000

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid Fee'
    )
  })

  it(`Handles invalid Sequence`, function () {
    txJson.Sequence = '1000'

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid Sequence'
    )
  })

  it(`Handles invalid AccountTxnID`, function () {
    txJson.AccountTxnID = ['INCORRECT']

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid AccountTxnID'
    )
  })

  it(`Handles invalid LastLedgerSequence`, function () {
    txJson.LastLedgerSequence = '1000'

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid LastLedgerSequence'
    )
  })

  it(`Handles invalid SourceTag`, function () {
    txJson.SourceTag = ['ARRAY']

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid SourceTag'
    )
  })

  it(`Handles invalid SigningPubKey`, function () {
    txJson.SigningPubKey = 1000

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid SigningPubKey'
    )
  })

  it(`Handles invalid TicketSequence`, function () {
    txJson.TicketSequence = '1000'

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid TicketSequence'
    )
  })

  it(`Handles invalid TxnSignature`, function () {
    txJson.TxnSignature = 1000

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid TxnSignature'
    )
  })

  it(`Handles invalid Signers`, function () {
    txJson.Signers = []

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid Signers'
    )

    txJson.Signers = [
      {
        Account: 'r....'
      }
    ]

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid Signers'
    )
  })

  it(`Handles invalid Memo`, function () {
    txJson.Memos = [
      {
        Memo: {
          MemoData: 'HI',
          Address: 'WRONG'
        }
      }
    ]

    assert.throws(
      () => verifyBaseTransaction(txJson),
      ValidationError,
      'BaseTransaction: invalid Memos'
    )
  })
})
