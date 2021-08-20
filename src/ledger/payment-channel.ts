import {Client} from '..'
import {validate, errors} from '../common'
import {LedgerEntryResponse} from '../common/types/commands'

import {
  parsePaymentChannel,
  FormattedPaymentChannel
} from './parse/payment-channel'

const NotFoundError = errors.NotFoundError

function formatResponse(
  response: LedgerEntryResponse
): FormattedPaymentChannel {
  if (response.node == null || response.node.LedgerEntryType !== 'PayChannel') {
    throw new NotFoundError('Payment channel ledger entry not found')
  }
  return parsePaymentChannel(response.node)
}

async function getPaymentChannel(
  this: Client,
  id: string
): Promise<FormattedPaymentChannel> {
  // 1. Validate
  validate.getPaymentChannel({id})
  // 2. Make Request
  const response = await this.request('ledger_entry', {
    index: id,
    binary: false,
    ledger_index: 'validated'
  })
  // 3. Return Formatted Response
  return formatResponse(response)
}

export default getPaymentChannel
