import {assert} from 'chai'

import {ValidationError} from 'xrpl-local/common/errors'

import {
  AccountDelete,
  verifyAccountDelete
} from '../../src/models/transactions/accountDelete'

/**
 * AccountDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AccountDelete Transaction Verification', function () {
  let accountDelete: AccountDelete

  beforeEach(function () {
    accountDelete = {
      TransactionType: 'AccountDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      DestinationTag: 13,
      Fee: '5000000',
      Sequence: 2470665,
      Flags: 2147483648
    }
  })

  it(`verifies valid AccountDelete`, function () {
    assert.doesNotThrow(() => verifyAccountDelete(accountDelete))
  })

  it(`throws w/ missing Destination`, function () {
    delete accountDelete.Destination

    assert.throws(
      () => verifyAccountDelete(accountDelete),
      ValidationError,
      'AccountDelete: missing field Destination'
    )
  })

  it(`throws w/ invalid Destination`, function () {
    accountDelete.Destination = 100

    assert.throws(
      () => verifyAccountDelete(accountDelete),
      ValidationError,
      'AccountDelete: invalid Destination'
    )
  })

  it(`throws w/ invalid DestinationTag`, function () {
    accountDelete.DestinationTag = 'DTAG'

    assert.throws(
      () => verifyAccountDelete(accountDelete),
      ValidationError,
      'AccountDelete: invalid DestinationTag'
    )
  })
})
