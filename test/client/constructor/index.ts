import {assert, expect} from 'chai'

import {Client} from '../../../src'
import type {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'Client - implicit server port': () => {
    assert.doesNotThrow(() => new Client({server: 'wss://s1.ripple.com'}))
  },

  'Client invalid options': () => {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({invalid: true}))
  },

  'Client valid options': () => {
    const client = new Client({server: 'wss://s:1'})
    const privateConnectionUrl = client.connection.url
    expect(privateConnectionUrl).to.equal('wss://s:1')
  },

  'Client invalid server uri': () => {
    assert.throws(() => new Client({server: 'wss//s:1'}))
  }
}

export default tests
