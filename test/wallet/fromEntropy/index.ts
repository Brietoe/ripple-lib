import {expect} from 'chai'

import ECDSA from '../../../src/common/ecdsa'
import Wallet from '../../../src/Wallet'
import {TestSuite} from '../../utils'

const ENTROPY_SIZE = 16
const entropy: number[] = new Array<number>(ENTROPY_SIZE).fill(0)
const publicKey =
  '0390A196799EE412284A5D80BF78C3E84CBB80E1437A0AECD9ADF94D7FEAAFA284'
const privateKey =
  '002512BBDFDBB77510883B7DCCBEF270B86DEAC8B64AC762873D75A1BEE6298665'
const publicKeyED25519 =
  'ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F'
const privateKeyED25519 =
  'ED0B6CBAC838DFE7F47EA1BD0DF00EC282FDF45510C92161072CCFB84035390C4D'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'Wallet.fromEntropy with entropy only': async (_api) => {
    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    expect(wallet.publicKey).to.equal(publicKeyED25519)
    expect(wallet.privateKey).to.equal(privateKeyED25519)
  },

  'Wallet.fromEntropy with algorithm ecdsa-secp256k1': async (_api) => {
    // GIVEN an entropy using ecdsa-secp256k1
    const algorithm = ECDSA.secp256k1

    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy, algorithm)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    expect(wallet.publicKey).to.equal(publicKey)
    expect(wallet.privateKey).to.equal(privateKey)
  },

  'Wallet.fromEntropy with algorithm ed25519': async (_api) => {
    // GIVEN an entropy using ed25519
    const algorithm = ECDSA.ed25519

    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy, algorithm)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    expect(wallet.publicKey).to.equal(publicKeyED25519)
    expect(wallet.privateKey).to.equal(privateKeyED25519)
  }
}

export default tests
