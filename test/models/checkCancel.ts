import {assert} from 'chai'

import {ValidationError} from 'xrpl-local/common/errors'

import {
  CheckCancel,
  verifyCheckCancel
} from '../../src/models/transactions/checkCancel'

/**
 * CheckCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CheckCancel Transaction Verification', function () {
  let checkCancel: CheckCancel

  beforeEach(function () {
    checkCancel = {
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TransactionType: 'CheckCancel',
      CheckID:
        '49647F0D748DC3FE26BDACBC57F251AADEFFF391403EC9BF87C97F67E9977FB0'
    }
  })

  it(`verifies valid CheckCancel`, function () {
    assert.doesNotThrow(() => verifyCheckCancel(checkCancel))
  })

  it(`throws w/ invalid CheckCancel`, function () {
    checkCancel.CheckID = 496473456789876545678909876545678

    assert.throws(
      () => verifyCheckCancel(checkCancel),
      ValidationError,
      'CheckCancel: invalid CheckID'
    )
  })
})
