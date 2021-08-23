import {fromSeed} from 'bip32'
import {mnemonicToSeedSync} from 'bip39'
import {decode, encodeForSigning} from 'ripple-binary-codec'
import {deriveKeypair, generateSeed, verify} from 'ripple-keypairs'

import ECDSA from './common/ecdsa'
import {ValidationError} from './common/errors'
import type {Transaction} from './models/transactions'

export interface SignOptions {
  signAs: string
}

/**
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemnoic, or entropy (array of random numbers).
 * It provides functionality to sign/verify transactions offline.
 */
class Wallet {
  private static readonly defaultAlgorithm: ECDSA = ECDSA.ed25519
  private static readonly defaultDerivationPath: string = "m/44'/144'/0'/0/0"
  public readonly publicKey: string
  public readonly privateKey: string

  /**
   * Construct a Wallet from a publicKey privateKey pair.
   *
   * @param publicKey - Public key owned by this wallet.
   * @param privateKey - Private key owned by this wallet.
   */
  public constructor(publicKey: string, privateKey: string) {
    this.publicKey = publicKey
    this.privateKey = privateKey
  }

  /**
   * Derives a wallet from a seed.
   *
   * @param seed - A string used to generate a keypair (publicKey/privateKey) to derive a wallet.
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A Wallet derived from a seed.
   */
  public static fromSeed(
    seed: string,
    algorithm: ECDSA = Wallet.defaultAlgorithm
  ): Wallet {
    return Wallet.deriveWallet(seed, algorithm)
  }

  /**
   * Derives a wallet from a mnemonic.
   *
   * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
   * @param derivationPath - The path to derive a keypair (publicKey/privateKey) from a seed (that was converted from a mnemonic).
   * @returns A Wallet derived from a mnemonic.
   * @throws When unable to derive keypair from mnemonic.
   */
  public static fromMnemonic(
    mnemonic: string,
    derivationPath: string = Wallet.defaultDerivationPath
  ): Wallet {
    const seed = mnemonicToSeedSync(mnemonic)
    const masterNode = fromSeed(seed)
    const node = masterNode.derivePath(derivationPath)
    if (node.privateKey === undefined) {
      throw new ValidationError(
        'Unable to derive privateKey from mnemonic input'
      )
    }

    const publicKey = Wallet.hexFromBuffer(node.publicKey)
    const privateKey = Wallet.hexFromBuffer(node.privateKey)
    return new Wallet(publicKey, `00${privateKey}`)
  }

  /**
   * Derives a wallet from an entropy (array of random numbers).
   *
   * @param entropy - An array of random numbers to generate a seed used to derive a wallet.
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A Wallet derived from an entropy.
   */
  public static fromEntropy(
    entropy: Uint8Array | number[],
    algorithm: ECDSA = Wallet.defaultAlgorithm
  ): Wallet {
    const options = {
      entropy: Uint8Array.from(entropy),
      algorithm
    }
    const seed = generateSeed(options)
    return Wallet.deriveWallet(seed, algorithm)
  }

  /**
   * Convert Buffer to hex string.
   *
   * @param buffer - Construct hex string from buffer.
   * @returns Uppercase hex representation of buffer.
   */
  private static hexFromBuffer(buffer: Buffer): string {
    return buffer.toString('hex').toUpperCase()
  }

  /**
   * Derives a wallet from a seed and an algorithm.
   *
   * @param seed - Seed used to derive wallet.
   * @param algorithm - Algorithm used to derive Wallet.
   * @returns Wallet derived from seed.
   */
  private static deriveWallet(
    seed: string,
    algorithm: ECDSA = Wallet.defaultAlgorithm
  ): Wallet {
    const {publicKey, privateKey} = deriveKeypair(seed, {algorithm})
    return new Wallet(publicKey, privateKey)
  }

  /**
   * Signs a transaction offline.
   *
   * @param transaction - A transaction to be signed offline.
   * @param options - Options to include for signing.
   * @returns A signed transaction.
   */
  public signTransaction(
    transaction: Transaction,
    options: SignOptions = {signAs: ''}
  ): SignedTransaction {
    return signOffline(this, JSON.stringify(transaction), options)
  }

  /**
   * Verifies a signed transaction offline.
   *
   * @param signedTransaction - A signed transaction (hex string of signTransaction result) to be verified offline.
   * @returns Returns true if a signedTransaction is valid.
   */
  public verifyTransaction(signedTransaction: string): boolean {
    const tx = decode(signedTransaction)
    const messageHex: string = encodeForSigning(tx)
    const signature = tx.TxnSignature
    return verify(messageHex, signature, this.publicKey)
  }
}

export default Wallet
