import BigNumber from 'bignumber.js'
import {expect} from 'chai'

import {Client} from '../../../src'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import type {TestSuite} from '../../utils'

interface Order {
  specification: {
    direction: 'buy' | 'sell'
    totalPrice: {
      value: string
    }
    quantity: {
      value: string
    }
  }
}

function checkSortingOfOrders(orders: Order[]): boolean {
  let previousRate = '0'
  for (const order of orders) {
    let rate: string

    // We calculate the quality of output/input here as a test.
    // This won't hold in general because when output and input amounts get tiny,
    // the quality can differ significantly. However, the offer stays in the
    // order book where it was originally placed. It would be more consistent
    // to check the quality from the offer book, but for the test data set,
    // this calculation holds.
    if (order.specification.direction === 'buy') {
      rate = new BigNumber(order.specification.quantity.value)
        .dividedBy(order.specification.totalPrice.value)
        .toString()
    } else {
      rate = new BigNumber(order.specification.totalPrice.value)
        .dividedBy(order.specification.quantity.value)
        .toString()
    }
    expect(new BigNumber(rate).isGreaterThanOrEqualTo(previousRate)).to.equal(
      true
    )

    previousRate = rate
  }
  return true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
const tests: TestSuite = {
  'normal': async (client, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    const directOffers = await client.request('book_offers', {
      taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.base),
      taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
      ledger_index: 'validated',
      limit: 20,
      taker: address
    })

    const reverseOffers = await client.request('book_offers', {
      taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
      taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.base),
      ledger_index: 'validated',
      limit: 20,
      taker: address
    })

    const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
      ...directOffers,
      ...reverseOffers
    ])

    expect(orderbook).to.equal(responses.getOrderbook.normal)
  },

  'with XRP': async (client: Client, address: string) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
      },
      counter: {
        currency: 'XRP'
      }
    }

    const directOfferResults = await client.request('book_offers', {
      taker_gets: orderbookInfo.base,
      taker_pays: orderbookInfo.counter,
      ledger_index: 'validated',
      limit: 20,
      taker: address
    })

    const reverseOfferResults = client.request('book_offers', {
      taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
      taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.base),
      ledger_index: 'validated',
      limit: 20,
      taker: address
    })

    const directOffers = directOfferResults
      ? directOfferResults.offers
      : [].flat()

    const reverseOffers = reverseOfferResults
      ? reverseOfferResults.offers
      : [].flat()

    const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
      ...directOffers,
      ...reverseOffers
    ])

    expect(orderbook).to.equal(responses.getOrderbook.withXRP)
  },

  'sample XRP/JPY book has orders sorted correctly': async (
    client: Client,
    _address
  ) => {
    const orderbookInfo = {
      base: {
        // the first currency in pair
        currency: 'XRP'
      },
      counter: {
        currency: 'JPY',
        issuer: 'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS'
      }
    }

    const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'

    const directOfferResults = client.request('book_offers', {
      taker_gets: orderbookInfo.base,
      taker_pays: orderbookInfo.counter,
      ledger_index: 'validated',
      limit: 400,
      taker: myAddress
    })

    const reverseOfferResults = client.request('book_offers', {
      taker_gets: orderbookInfo.counter,
      taker_pays: orderbookInfo.base,
      ledger_index: 'validated',
      limit: 400,
      taker: myAddress
    })

    const directOffers = directOfferResults ? directOfferResults.offers : []

    const reverseOffers = reverseOfferResults ? reverseOfferResults.offers : []

    const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
      ...directOffers,
      ...reverseOffers
    ])

    expect(orderbook.bids).to.equal([])
    expect(checkSortingOfOrders(orderbook.asks)).to.equal(true)
  },

  'sample USD/XRP book has orders sorted correctly': async (
    client,
    _address
  ) => {
    const orderbookInfo = {
      counter: {currency: 'XRP'},
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'

    const directOfferResults = await client.request('book_offers', {
      taker_gets: orderbookInfo.base,
      taker_pays: orderbookInfo.counter,
      ledger_index: 'validated',
      limit: 400,
      taker: myAddress
    })

    const reverseOfferResults = await client.request('book_offers', {
      taker_gets: orderbookInfo.counter,
      taker_pays: orderbookInfo.base,
      ledger_index: 'validated',
      limit: 400,
      taker: myAddress
    })

    const directOffers = directOfferResults
      ? directOfferResults.offers
      : [].flat()
    const reverseOffers = reverseOfferResults
      ? reverseOfferResults.offers
      : [].flat()
    const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
      ...directOffers,
      ...reverseOffers
    ])
    return (
      checkSortingOfOrders(orderbook.bids) &&
      checkSortingOfOrders(orderbook.asks)
    )
  },

  'sorted so that best deals come first': async (client, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = directOfferResults
        ? directOfferResults.offers
        : [].flat()
      const reverseOffers = reverseOfferResults
        ? reverseOfferResults.offers
        : [].flat()
      const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      const bidRates = orderbook.bids.map(
        (bid) => bid.properties.makerExchangeRate
      )
      const askRates = orderbook.asks.map(
        (ask) => ask.properties.makerExchangeRate
      )
      // makerExchangeRate = quality = takerPays.value/takerGets.value
      // so the best deal for the taker is the lowest makerExchangeRate
      // bids and asks should be sorted so that the best deals come first
      assert.deepEqual(bidRates.map((x) => Number(x)).sort(), bidRates)
      assert.deepEqual(askRates.map((x) => Number(x)).sort(), askRates)
    })
  },

  'currency & counterparty are correct': async (client, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = directOfferResults
        ? directOfferResults.offers
        : [].flat()
      const reverseOffers = reverseOfferResults
        ? reverseOfferResults.offers
        : [].flat()
      const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      const orders = [...orderbook.bids, ...orderbook.asks]
      orders.forEach((order) => {
        const quantity = order.specification.quantity
        const totalPrice = order.specification.totalPrice
        const {base, counter} = requests.getOrderbook.normal
        assert.strictEqual(quantity.currency, base.currency)
        assert.strictEqual(quantity.counterparty, base.counterparty)
        assert.strictEqual(totalPrice.currency, counter.currency)
        assert.strictEqual(totalPrice.counterparty, counter.counterparty)
      })
    })
  },

  'direction is correct for bids and asks': async (client, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      client.request('book_offers', {
        taker_gets: Client.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: Client.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = directOfferResults
        ? directOfferResults.offers
        : [].flat()
      const reverseOffers = reverseOfferResults
        ? reverseOfferResults.offers
        : [].flat()
      const orderbook = Client.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      assert(
        orderbook.bids.every((bid) => bid.specification.direction === 'buy')
      )
      assert(
        orderbook.asks.every((ask) => ask.specification.direction === 'sell')
      )
    })
  }
}

export default tests
