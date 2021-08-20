import {createHash} from 'crypto'

const HASH_SIZE = 64

/**
 * Computes the SHA512 hash of a hex string.
 *
 * @param hex - String to hash.
 * @returns Hash of the hex string.
 */
function sha512Half(hex: string): string {
  return createHash('sha512')
    .update(Buffer.from(hex, 'hex'))
    .digest('hex')
    .toUpperCase()
    .slice(0, HASH_SIZE)
}

export default sha512Half
