import {Client} from '..'
import {validate, iso8601ToRippleTime, toRippledAmount} from '../common'
import {FormattedOrderSpecification} from '../common/types/objects/index'

import {Instructions, Prepare, OfferCreateTransaction} from './types'
import * as utils from './utils'

const offerFlags = utils.common.txFlags.OfferCreate

function createOrderTransaction(
  account: string,
  order: FormattedOrderSpecification
): OfferCreateTransaction {
  const takerPays = toRippledAmount(
    order.direction === 'buy' ? order.quantity : order.totalPrice
  )
  const takerGets = toRippledAmount(
    order.direction === 'buy' ? order.totalPrice : order.quantity
  )

  const txJSON: Partial<OfferCreateTransaction> = {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets,
    TakerPays: takerPays,
    Flags: 0
  }
  if (order.direction === 'sell') {
    txJSON.Flags |= offerFlags.Sell
  }
  if (order.passive) {
    txJSON.Flags |= offerFlags.Passive
  }
  if (order.immediateOrCancel) {
    txJSON.Flags |= offerFlags.ImmediateOrCancel
  }
  if (order.fillOrKill) {
    txJSON.Flags |= offerFlags.FillOrKill
  }
  if (order.expirationTime != null) {
    txJSON.Expiration = iso8601ToRippleTime(order.expirationTime)
  }
  if (order.orderToReplace != null) {
    txJSON.OfferSequence = order.orderToReplace
  }
  if (order.memos != null) {
    txJSON.Memos = order.memos.map(utils.convertMemo)
  }
  return txJSON as OfferCreateTransaction
}

function prepareOrder(
  this: Client,
  address: string,
  order: FormattedOrderSpecification,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareOrder({address, order, instructions})
    const txJSON = createOrderTransaction(address, order)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareOrder
