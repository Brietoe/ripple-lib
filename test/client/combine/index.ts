import {assert, expect} from 'chai'
import binary from 'ripple-binary-codec'

import type {Client} from '../../../src'
import {ValidationError} from '../../../src/common/errors'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import type {TestSuite} from '../../utils'

const setDomain = requests.combine.setDomain

const single = responses.combine.single

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'combine': (client: Client, _address) => {
    const combined = client.combine(setDomain)
    expect(combined).to.equal(single)
  },

  'combine - different transactions': async (client: Client, _address) => {
    const request = [setDomain[0]]
    const tx = binary.decode(setDomain[0])
    tx.Flags = 0
    request.push(binary.encode(tx))

    assert.throws(
      () => client.combine(request),
      ValidationError,
      'txJSON is not the same for all signedTransactions/'
    )
  }
}

export default tests
