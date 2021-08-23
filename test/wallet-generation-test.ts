import {expect} from 'chai'

import {getFaucetUrl, FaucetNetwork} from '../src/wallet/wallet-generation'

import setupClient from './setup-client'

describe('Get Faucet URL', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  it('returns the Devnet URL', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    this.client.connection.url = FaucetNetwork.Devnet

    expect(getFaucetUrl(this.client)).to.equal(expectedFaucet)
  })

  it('returns the Testnet URL', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = FaucetNetwork.Testnet

    expect(getFaucetUrl(this.client)).to.equal(expectedFaucet)
  })

  it('returns the Testnet URL with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = 'wss://testnet.xrpl-labs.com'

    expect(getFaucetUrl(this.client)).to.equal(expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    expect(getFaucetUrl(this.client)).to.equal(undefined)
  })
})
