import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {TestSuite, assertResultMatch} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async signPaymentChannelClaim(client, address) {
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A'
    const result = client.signPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      privateKey
    )
    assertResultMatch(
      result,
      responses.signPaymentChannelClaim,
      'signPaymentChannelClaim'
    )
  }
}
