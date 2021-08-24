import {expect} from 'chai'

import type {Client} from '../../../src'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'returns address for public key': async (
    client: Client,
    _address: string
  ) => {
    const address = client.deriveAddress(
      '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06'
    )
    expect(address).to.equal('rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K')
  }
}

export default tests
