import assert from 'assert-diff'
import _ from 'lodash'

import responses from './fixtures/responses'
import ledgerClosed from './fixtures/rippled/ledger-close.json'
import setupClient from './setup-client'
import {ignoreWebSocketDisconnect} from './utils'

const TIMEOUT = 20000

function checkResult(expected, schemaName, response) {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(JSON.parse(response.txJSON), JSON.parse(expected.txJSON))
  }
  assert.deepEqual(_.omit(response, 'txJSON'), _.omit(expected, 'txJSON'))
  if (schemaName) {
    schemaValidator.schemaValidate(schemaName, response)
  }
  return response
}

describe('ClientBroadcast', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupClient.setupBroadcast)
  afterEach(setupClient.teardown)

  it('base', function () {
    const expected = {request_server_info: 1}
    this.mocks.forEach((mock) => mock.expect({...expected}))
    assert(this.client.isConnected())
    return this.client
      .getServerInfo()
      .then(_.partial(checkResult, responses.getServerInfo, 'getServerInfo'))
  })

  it('ledger', function (done) {
    let gotLedger = 0
    this.client.on('ledger', () => {
      gotLedger++
    })
    const ledgerNext = {...ledgerClosed}
    ledgerNext.ledger_index++

    this.client._clients.forEach((client) =>
      client.connection
        .request({
          command: 'echo',
          data: ledgerNext
        })
        .catch(ignoreWebSocketDisconnect)
    )

    setTimeout(() => {
      assert.strictEqual(gotLedger, 1)
      done()
    }, 1250)
  })

  it('error propagation', function (done) {
    this.client.once('error', (type, info) => {
      assert.strictEqual(type, 'type')
      assert.strictEqual(info, 'info')
      done()
    })
    this.client._clients[1].connection
      .request({
        command: 'echo',
        data: {error: 'type', error_message: 'info'}
      })
      .catch(ignoreWebSocketDisconnect)
  })
})
