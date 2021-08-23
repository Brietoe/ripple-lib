/* eslint-disable @typescript-eslint/no-magic-numbers -- Tests w/ number */
import {expect, assert} from 'chai'

import RangeSet from '../src/common/rangeSet'

describe('RangeSet', function () {
  it('addRange()/addValue()', function () {
    const rs = new RangeSet()

    rs.addRange(4, 5)
    rs.addRange(7, 10)
    rs.addRange(1, 2)
    rs.addValue(3)

    expect(rs.serialize()).to.equal('1-5,7-10')
  })

  it('addValue()/addRange() -- malformed', function () {
    const rs = new RangeSet()
    assert.throws(() => rs.addRange(2, 1))
  })

  it('parseAndAddRanges()', function () {
    const rs = new RangeSet()
    rs.parseAndAddRanges('4-5,7-10,1-2,3-3')
    expect(rs.serialize()).to.equal('1-5,7-10')
  })

  it('parseAndAddRanges() -- single ledger', function () {
    const rs = new RangeSet()

    rs.parseAndAddRanges('3')
    expect(rs.serialize()).to.equal('3-3')
    expect(rs.containsValue(3)).to.equal(true)
    expect(!rs.containsValue(0)).to.equal(false)
    expect(!rs.containsValue(2)).to.equal(false)
    expect(!rs.containsValue(4)).to.equal(false)
    expect(rs.containsRange(3, 3)).to.equal(true)
    expect(!rs.containsRange(3, 4)).to.equal(false)

    rs.parseAndAddRanges('1-5')
    expect(rs.serialize()).to.equal('1-5')
    expect(rs.containsValue(3)).to.equal(true)
    expect(rs.containsValue(1)).to.equal(true)
    expect(rs.containsValue(5)).to.equal(true)
    expect(!rs.containsValue(6)).to.equal(false)
    expect(!rs.containsValue(0)).to.equal(false)
    expect(rs.containsRange(1, 5)).to.equal(true)
    expect(rs.containsRange(2, 4)).to.equal(true)
    expect(!rs.containsRange(1, 6)).to.equal(false)
    expect(!rs.containsRange(0, 3)).to.equal(false)
  })

  it('containsValue()', function () {
    const rs = new RangeSet()

    rs.addRange(32570, 11005146)
    rs.addValue(11005147)

    expect(rs.containsValue(1)).to.equal(false)
    expect(rs.containsValue(32569)).to.equal(false)
    expect(rs.containsValue(32570)).to.equal(true)
    expect(rs.containsValue(50000)).to.equal(true)
    expect(rs.containsValue(11005146)).to.equal(true)
    expect(rs.containsValue(11005147)).to.equal(true)
    expect(rs.containsValue(11005148)).to.equal(false)
    expect(rs.containsValue(12000000)).to.equal(false)
  })

  it('reset()', function () {
    const rs = new RangeSet()

    rs.addRange(4, 5)
    rs.addRange(7, 10)
    rs.reset()

    expect(rs.serialize()).to.equal('')
  })
})
