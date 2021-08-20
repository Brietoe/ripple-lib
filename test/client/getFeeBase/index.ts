import assert from 'assert-diff'

import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'default test': async (client, address) => {
    const fee = await client.connection.getFeeBase()
    assert.strictEqual(fee, 10)
  }
}
