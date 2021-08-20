import assert from 'assert-diff'

import {getFaucetUrl, FaucetNetwork} from '../src/wallet/wallet-generation'

import setupClient from './setup-client'

describe('Get Faucet URL', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  it('returns the Devnet URL', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    this.client.connection._url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns the Testnet URL', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection._url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns the Testnet URL with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection._url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.strictEqual(getFaucetUrl(this.client), undefined)
  })
})
