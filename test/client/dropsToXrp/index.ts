/* eslint-disable @typescript-eslint/no-magic-numbers -- Magic number used for testing */
import BigNumber from 'bignumber.js'
import {expect, assert} from 'chai'

import type {Client} from '../../../src'
import {ValidationError} from '../../../src/common/errors'
import type {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'works with a typical amount': (client: Client) => {
    const xrp = client.dropsToXrp('2000000')

    expect(xrp).to.equal('2')
  },

  'works with fractions': (client) => {
    let xrp = client.dropsToXrp('3456789')
    expect(xrp).to.equal('3.456789')

    xrp = client.dropsToXrp('3400000')
    expect(xrp).to.equal('3.4')

    xrp = client.dropsToXrp('1')
    expect(xrp).to.equal('0.000001')

    xrp = client.dropsToXrp('1.0')
    expect(xrp).to.equal('0.000001')

    xrp = client.dropsToXrp('1.00')
    expect(xrp).to.equal('0.000001')
  },

  'works with zero': (client) => {
    let xrp = client.dropsToXrp('0')
    expect(xrp).to.equal('0')

    // negative zero is equivalent to zero
    xrp = client.dropsToXrp('-0')
    expect(xrp).to.equal('0')

    xrp = client.dropsToXrp('0.00')
    expect(xrp).to.equal('0')

    xrp = client.dropsToXrp('000000000')
    expect(xrp).to.equal('0')
  },

  'works with a negative value': (client) => {
    const xrp = client.dropsToXrp('-2000000')
    expect(xrp).to.equal('-2')
  },

  'works with a value ending with a decimal point': (client: Client) => {
    let xrp = client.dropsToXrp('2000000.')
    expect(xrp).to.equal('2')

    xrp = client.dropsToXrp('-2000000.')
    expect(xrp).to.equal('-2')
  },

  'works with BigNumber objects': (client: Client) => {
    let xrp = client.dropsToXrp(new BigNumber(2000000))
    expect(xrp).to.equal('2')

    xrp = client.dropsToXrp(new BigNumber(-2000000))
    expect(xrp).to.equal('-2')

    xrp = client.dropsToXrp(new BigNumber(2345678))
    expect(xrp).to.equal('2.345678')

    xrp = client.dropsToXrp(new BigNumber(-2345678))
    expect(xrp).to.equal('-2.345678')
  },
  'works with a number': (client) => {
    let xrp = client.dropsToXrp(2000000)
    expect(xrp).to.equal('2')

    xrp = client.dropsToXrp(-2000000)
    expect(xrp).to.equal('-2')
  },

  'throws with an amount with too many decimal places': (client: Client) => {
    assert.throws(
      () => client.dropsToXrp('1.2'),
      ValidationError,
      'has too many decimal places'
    )

    assert.throws(
      () => client.dropsToXrp('0.10'),
      ValidationError,
      'has too many decimal places'
    )
  },

  'throws with an invalid value': (client: Client) => {
    assert.throws(
      () => client.dropsToXrp('FOO'),
      ValidationError,
      'invalid value'
    )

    assert.throws(
      () => client.dropsToXrp('1e-7'),
      ValidationError,
      'invalid value'
    )

    assert.throws(
      () => client.dropsToXrp('2,0'),
      ValidationError,
      'invalid value'
    )

    assert.throws(
      () => client.dropsToXrp('.'),
      ValidationError,
      'dropsToXrp: invalid value, should be a BigNumber or string-encoded number'
    )
  },

  'throws with an amount more than one decimal point': (client: Client) => {
    assert.throws(
      () => client.dropsToXrp('1.0.0'),
      ValidationError,
      "dropsToXrp: invalid value '1.0.0'"
    )

    assert.throws(
      () => client.dropsToXrp('...'),
      ValidationError,
      "dropsToXrp: invalid value '...'"
    )
  }
}

export default tests
