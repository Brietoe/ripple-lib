import hashPrefix from '../hashPrefix'
import sha512Half from '../sha512Half'

import {NodeType, Node} from './node'

/**
 * Class for SHAMap Leaf Node.
 */
class Leaf extends Node {
  public tag: string
  public type: NodeType
  public data: string

  /**
   * Leaf node in a SHAMap tree.
   *
   * @param tag - Equates to a ledger entry `index`.
   * @param data - Hex of account state, transaction etc.
   * @param type - One of TYPE_ACCOUNT_STATE, TYPE_TRANSACTION_MD etc.
   */
  public constructor(tag: string, data: string, type: NodeType) {
    super()
    this.tag = tag
    this.type = type
    this.data = data
  }

  /**
   * Add item to Leaf.
   *
   * @param tag - Index of the Node.
   * @param node - Node to insert.
   * @throws When called, becasue LeafNodes cannot addItem.
   */
  public addItem(tag: string, node: Node): void {
    throw new Error('Cannot call addItem on a LeafNode')
  }

  /**
   * Get the hash of a LeafNode.
   *
   * @returns Hash or undefined.
   * @throws If node is of unknown type.
   */
  public get hash(): string | undefined {
    switch (this.type) {
      case NodeType.ACCOUNT_STATE: {
        const leafPrefix = hashPrefix.LEAF_NODE.toString(16)
        return sha512Half(leafPrefix + this.data + this.tag)
      }
      case NodeType.TRANSACTION_NO_METADATA: {
        const txIDPrefix = hashPrefix.TRANSACTION_ID.toString(16)
        return sha512Half(txIDPrefix + this.data)
      }
      case NodeType.TRANSACTION_METADATA: {
        const txNodePrefix = hashPrefix.TRANSACTION_NODE.toString(16)
        return sha512Half(txNodePrefix + this.data + this.tag)
      }
      default:
        throw new Error('Tried to hash a SHAMap node of unknown type.')
    }
  }
}

export default Leaf
