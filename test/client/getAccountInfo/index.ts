import responses from '../../fixtures/responses'
import {TestSuite} from '../../utils'

export {expect} from 'chai'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'getAccountInfo': async (client, address) => {
    const result = await client.getAccountInfo(address)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - options undefined': async (client, address) => {
    const result = await client.getAccountInfo(address, undefined)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-expect-error - This is intentionally invalid
      client.getAccountInfo(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  }
}

export default tests
