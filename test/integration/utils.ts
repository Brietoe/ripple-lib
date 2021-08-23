import type {Client} from '../../src'
import Wallet from '../../src/Wallet'

const masterWallet = new Wallet(
  'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
)

function ledgerAccept(client: Client): void {
  return client.connection.request({command: 'ledger_accept'})
}

function pay(client, from, to, amount, secret, currency = 'XRP', counterparty) {
  const paymentSpecification = {
    source: {
      address: from,
      maxAmount: {
        value: amount,
        currency
      }
    },
    destination: {
      address: to,
      amount: {
        value: amount,
        currency
      }
    }
  }

  if (counterparty != null) {
    paymentSpecification.source.maxAmount.counterparty = counterparty
    paymentSpecification.destination.amount.counterparty = counterparty
  }

  let id = null
  return client
    .preparePayment(from, paymentSpecification, {})
    .then((data) => client.sign(data.txJSON, secret))
    .then((signed) => {
      id = signed.id
      return client.submit(signed.signedTransaction)
    })
    .then(() => ledgerAccept(client))
    .then(() => id)
}

function payTo(client, to, amount = '4003218', currency = 'XRP', counterparty) {
  return pay(
    client,
    masterAccount,
    to,
    amount,
    masterSecret,
    currency,
    counterparty
  )
}

module.exports = {
  pay,
  payTo,
  ledgerAccept
}
