import {classicAddressToXAddress} from 'ripple-address-codec'
import {deriveKeypair, deriveAddress} from 'ripple-keypairs'

interface DeriveXAddressOptions {
  publicKey: string
  tag: number | false
  test: boolean
}

/**
 * Derive an XAddress from a public key.
 *
 * @param options - A public Key and a tag.
 * @returns An XAddress.
 */
function deriveXAddress(options: DeriveXAddressOptions): string {
  const classicAddress = deriveAddress(options.publicKey)
  return classicAddressToXAddress(classicAddress, options.tag, options.test)
}

export {deriveKeypair, deriveAddress, deriveXAddress}
