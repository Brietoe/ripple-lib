import _ from 'lodash'

import { PaymentChannelCreate, hashes, PaymentChannelFund } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000
const { hashPaymentChannel } = hashes

describe('PaymentChannelFund', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const paymentChannelCreate: PaymentChannelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: this.wallet.getClassicAddress(),
      Amount: '100',
      Destination: wallet2.getClassicAddress(),
      SettleDelay: 86400,
      PublicKey: this.wallet.publicKey,
    }

    const paymentChannelResponse = await this.client.submit(
      this.wallet,
      paymentChannelCreate,
    )
    await testTransaction(this.client, paymentChannelCreate, this.wallet)

    const paymentChannelFund: PaymentChannelFund = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'PaymentChannelFund',
      Channel: hashPaymentChannel(
        this.wallet.getClassicAddress(),
        wallet2.getClassicAddress(),
        paymentChannelResponse.result.tx_json.Sequence ?? 0,
      ),
      Amount: '100',
    }

    await testTransaction(this.client, paymentChannelFund, this.wallet)
  })
})
