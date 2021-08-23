import {expect} from 'chai'

import {RippleError} from '../../../src/common/errors'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'RippleError with data': async (_client, _address) => {
    const error = new RippleError('_message_', '_data_')

    expect(error.toString()).to.equal("[RippleError(_message_, '_data_')]")
  },

  'NotFoundError default message': async (client, _address) => {
    const error = new client.errors.NotFoundError()
    expect(error.toString()).to.equal('[NotFoundError(Not found)]')
  }
}

export default tests
