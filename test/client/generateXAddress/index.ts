import {assert, expect} from 'chai'

import ECDSA from '../../../src/common/ecdsa'
import {UnexpectedError} from '../../../src/common/errors'
import responses from '../../fixtures/responses'
import type {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'generateXAddress': async (client) => {
    // GIVEN entropy of all zeros
    function random(): number[] {
      return new Array<number>(16).fill(0)
    }

    expect(client.generateXAddress({entropy: random()})).to.equal(
      responses.generateXAddress
    )
  },

  'generateXAddress invalid entropy': async (client) => {
    assert.throws(() => {
      // GIVEN entropy of 1 byte
      function random(): number[] {
        return new Array<number>(1).fill(0)
      }

      // WHEN generating an X-address
      client.generateXAddress({entropy: random()})

      // THEN an UnexpectedError is thrown
      // because 16 bytes of entropy are required
    }, UnexpectedError)
  },

  'generateXAddress with no options object': async (client) => {
    // GIVEN no options

    // WHEN generating an X-address
    const account = client.generateXAddress()

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    expect(account.xAddress.startsWith('X')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)
  },

  'generateXAddress with empty options object': async (client) => {
    // GIVEN an empty options object
    const options = {}

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    expect(account.xAddress.startsWith('X')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)
  },

  'generateXAddress with algorithm `ecdsa-secp256k1`': async (client) => {
    const account = client.generateXAddress({algorithm: ECDSA.secp256k1})

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    expect(account.xAddress.startsWith('X')).to.equal(true)

    expect(account.secret.startsWith('s')).to.equal(true)

    expect(account.secret.startsWith('sEd')).to.equal(false)
  },

  'generateXAddress with algorithm `ed25519`': async (client) => {
    const account = client.generateXAddress({algorithm: ECDSA.ed25519})

    expect(account.xAddress.startsWith('X')).to.equal(true)
    expect(account.secret.startsWith('sEd')).to.equal(true)
  },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy': async (
    client
  ) => {
    const account = client.generateXAddress({
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0)
    })

    expect(account).to.equal(responses.generateXAddress)
  },

  'generateXAddress with algorithm `ed25519` and given entropy': async (
    client
  ) => {
    const account = client.generateXAddress({
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0)
    })

    // THEN we get the expected return value
    expect(account).to.equal({
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE'
    })
  },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address':
    async (client) => {
      const account = client.generateXAddress({
        algorithm: ECDSA.secp256k1,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true
      })

      // THEN we get the expected return value
      expect(account).to.equal(responses.generateAddress)
    },

  'generateXAddress with algorithm `ed25519` and given entropy; include classic address':
    async (client) => {
      const account = client.generateXAddress({
        algorithm: ECDSA.ed25519,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true
      })

      expect(account).to.equal({
        xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',
        secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
        classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
        address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
      })
    },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address; for test network use':
    async (client) => {
      const account = client.generateXAddress({
        algorithm: ECDSA.secp256k1,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true,
        test: true
      })

      // THEN we get the expected return value
      const response = {
        ...responses.generateAddress,
        xAddress: 'TVG3TcCD58BD6MZqsNuTihdrhZwR8SzvYS8U87zvHsAcNw4'
      }
      expect(account).to.equal(response)
    },

  'generateXAddress with algorithm `ed25519` and given entropy; include classic address; for test network use':
    async (client) => {
      const account = client.generateXAddress({
        algorithm: ECDSA.ed25519,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true,
        test: true
      })

      expect(account).to.equal({
        xAddress: 'T7t4HeTMF5tT68agwuVbJwu23ssMPeh8dDtGysZoQiij1oo',
        secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
        classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
        address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
      })
    },

  'generateXAddress for test network use': async (client) => {
    const account = client.generateXAddress({test: true})

    // THEN we get an object with xAddress starting with 'T' and a secret starting with 's'
    expect(account.xAddress.startsWith('T')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)
  }
}

export default tests
