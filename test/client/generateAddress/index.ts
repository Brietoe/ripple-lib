import {assert, expect} from 'chai'

import type {Client} from '../../../src'
import ECDSA from '../../../src/common/ecdsa'
import {UnexpectedError} from '../../../src/common/errors'
import {GenerateAddressOptions} from '../../../src/offline/generateAddress'
import responses from '../../fixtures/responses'
import {TestSuite} from '../../utils'

const {generateAddress: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'generateAddress': async (client: Client) => {
    function random(): number[] {
      return new Array<number>(16).fill(0)
    }

    expect(client.generateAddress({entropy: random()})).to.equal(
      RESPONSE_FIXTURES
    )
  },

  'generateAddress invalid entropy': async (client) => {
    assert.throws(() => {
      // GIVEN entropy of 1 byte
      function random(): number[] {
        return new Array<number>(1).fill(0)
      }

      // WHEN generating an address
      client.generateAddress({entropy: random()})

      // THEN an UnexpectedError is thrown
      // because 16 bytes of entropy are required
    }, UnexpectedError)
  },

  'generateAddress with no options object': async (client) => {
    // GIVEN no options

    // WHEN generating an address
    const account = client.generateAddress()

    // THEN we get an object with an address starting with 'r' and a secret starting with 's'
    expect(account.address.startsWith('r')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)
  },

  'generateAddress with empty options object': async (client) => {
    // GIVEN an empty options object
    const options = {}

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get an object with an address starting with 'r' and a secret starting with 's'
    expect(account.address.startsWith('r')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)
  },

  'generateAddress with algorithm `ecdsa-secp256k1`': async (client) => {
    // GIVEN we want to use 'ecdsa-secp256k1'
    const options: GenerateAddressOptions = {algorithm: ECDSA.secp256k1}

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get an object with an address starting with 'r' and a secret starting with 's' (not 'sEd')
    expect(account.address.startsWith('r')).to.equal(true)
    expect(account.secret.startsWith('s')).to.equal(true)

    expect(account.secret.startsWith('sEd')).to.equal(false)
  },

  'generateAddress with algorithm `ed25519`': async (client) => {
    // GIVEN we want to use 'ed25519'
    const options: GenerateAddressOptions = {algorithm: ECDSA.ed25519}

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get an object with an address starting with 'r' and a secret starting with 'sEd'
    expect(account.address.startsWith('r')).to.equal(true)
    expect(account.secret.startsWith('sEd')).to.equal(true)
  },

  'generateAddress with algorithm `ecdsa-secp256k1` and given entropy': async (
    client
  ) => {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0)
    }

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get the expected return value
    expect(account).to.equal(responses.generateAddress)
  },

  'generateAddress with algorithm `ed25519` and given entropy': async (
    client
  ) => {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0)
    }

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get the expected return value
    expect(account).to.equal({
      // generateAddress return value always includes xAddress to encourage X-address adoption
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',

      classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE'
    })
  },

  'generateAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address':
    async (client) => {
      // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
      const options: GenerateAddressOptions = {
        algorithm: ECDSA.secp256k1,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true
      }

      // WHEN generating an address
      const account = client.generateAddress(options)

      // THEN we get the expected return value
      expect(account).to.equal(responses.generateAddress)
    },

  'generateAddress with algorithm `ed25519` and given entropy; include classic address':
    async (client) => {
      // GIVEN we want to use 'ed25519' with entropy of zero
      const options: GenerateAddressOptions = {
        algorithm: ECDSA.ed25519,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true
      }

      // WHEN generating an address
      const account = client.generateAddress(options)

      // THEN we get the expected return value
      expect(account).to.equal({
        // generateAddress return value always includes xAddress to encourage X-address adoption
        xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',

        secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
        classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
        address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
      })
    },

  'generateAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address; for test network use':
    async (client) => {
      // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
      const options: GenerateAddressOptions = {
        algorithm: ECDSA.secp256k1,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true,
        test: true
      }

      // WHEN generating an address
      const account = client.generateAddress(options)

      // THEN we get the expected return value
      const response = {
        ...responses.generateAddress,
        xAddress: 'TVG3TcCD58BD6MZqsNuTihdrhZwR8SzvYS8U87zvHsAcNw4'
      }
      expect(account).to.equal(response)
    },

  'generateAddress with algorithm `ed25519` and given entropy; include classic address; for test network use':
    async (client) => {
      // GIVEN we want to use 'ed25519' with entropy of zero
      const options: GenerateAddressOptions = {
        algorithm: ECDSA.ed25519,
        entropy: new Array(16).fill(0),
        includeClassicAddress: true,
        test: true
      }

      // WHEN generating an address
      const account = client.generateAddress(options)

      // THEN we get the expected return value
      expect(account).to.equal({
        // generateAddress return value always includes xAddress to encourage X-address adoption
        xAddress: 'T7t4HeTMF5tT68agwuVbJwu23ssMPeh8dDtGysZoQiij1oo',

        secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
        classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
        address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
      })
    },

  'generateAddress for test network use': async (client) => {
    // GIVEN we want an address for test network use
    const options: GenerateAddressOptions = {test: true}

    // WHEN generating an address
    const account = client.generateAddress(options)

    // THEN we get an object with xAddress starting with 'T' and a secret starting with 's'

    // generateAddress return value always includes xAddress to encourage X-address adoption
    expect(account.xAddress.startsWith('T')).to.equal(true)

    expect(account.secret.startsWith('s')).to.equal(true)
  }
}

export default tests
