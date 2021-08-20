import binary from 'ripple-binary-codec'
import keypairs from 'ripple-keypairs'

import * as common from '../common'

const {validate, xrpToDrops} = common

function signPaymentChannelClaim(
  channel: string,
  amount: string,
  privateKey: string
): string {
  validate.signPaymentChannelClaim({channel, amount, privateKey})

  const signingData = binary.encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount)
  })
  return keypairs.sign(signingData, privateKey)
}

export default signPaymentChannelClaim
