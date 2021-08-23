import {expect} from 'chai'

import {Client} from '../../../src'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'returns address for public key': (_client, _address) => {
    expect(
      Client.deriveXAddress({
        publicKey:
          '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: false
      })
    ).to.equal('XVZVpQj8YSVpNyiwXYSqvQoQqgBttTxAZwMcuJd4xteQHyt')

    expect(
      Client.deriveXAddress({
        publicKey:
          '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: true
      })
    ).to.equal('TVVrSWtmQQssgVcmoMBcFQZKKf56QscyWLKnUyiuZW8ALU4')
  }
}

export default tests
