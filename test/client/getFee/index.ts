import assert from 'assert-diff'

import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getFee': async (client, address) => {
    const fee = await client.getFee()
    assert.strictEqual(fee, '0.000012')
  },

  'getFee default': async (client, address) => {
    client._feeCushion = undefined
    const fee = await client.getFee()
    assert.strictEqual(fee, '0.000012')
  },

  'getFee - high load_factor': async (client, address) => {
    client.connection.request({
      command: 'config',
      data: {highLoadFactor: true}
    })
    const fee = await client.getFee()
    assert.strictEqual(fee, '2')
  },

  'getFee - high load_factor with custom maxFeeXRP': async (
    client,
    address
  ) => {
    // Ensure that overriding with high maxFeeXRP of '51540' causes no errors.
    // (fee will actually be 51539.607552)
    client._maxFeeXRP = '51540'
    client.connection.request({
      command: 'config',
      data: {highLoadFactor: true}
    })
    const fee = await client.getFee()
    assert.strictEqual(fee, '51539.607552')
  },

  'getFee custom cushion': async (client, address) => {
    client._feeCushion = 1.4
    const fee = await client.getFee()
    assert.strictEqual(fee, '0.000014')
  },

  // This is not recommended since it may result in attempting to pay
  // less than the base fee. However, this test verifies the existing behavior.
  'getFee cushion less than 1.0': async (client, address) => {
    client._feeCushion = 0.9
    const fee = await client.getFee()
    assert.strictEqual(fee, '0.000009')
  },

  'getFee reporting': async (client, address) => {
    client.connection.request({
      command: 'config',
      data: {reporting: true}
    })
    const fee = await client.getFee()
    assert.strictEqual(fee, '0.000012')
  }
}
