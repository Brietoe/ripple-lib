import {expect, assert} from 'chai'

import type {Client} from '../../../src'
import {ValidationError} from '../../../src/common/errors'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'returns keypair for secret': (client: Client, _address) => {
    const keypair = client.deriveKeypair('snsakdSrZSLkYpCXxfRkS4Sh96PMK')

    expect(keypair.privateKey).to.equal(
      '008850736302221AFD59FF9CA1A29D4975F491D726249302EE48A3078A8934D335'
    )
    expect(keypair.publicKey).to.equal(
      '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06'
    )
  },

  'returns keypair for ed25519 secret': (client, _address) => {
    const keypair = client.deriveKeypair('sEdV9eHWbibBnTj7b1H5kHfPfv7gudx')
    expect(keypair.privateKey).to.equal(
      'ED5C2EF6C2E3200DFA6B72F47935C7F64D35453646EA34919192538F458C7BC30F'
    )
    expect(keypair.publicKey).to.equal(
      'ED0805EC4E728DB87C0CA6C420751F296C57A5F42D02E9E6150CE60694A44593E5'
    )
  },

  'throws with an invalid secret': async (client, _address) => {
    assert.throws(
      () => client.deriveKeypair('...'),
      ValidationError,
      'Error: Non-base58 character'
    )
  }
}
