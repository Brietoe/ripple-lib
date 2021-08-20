import * as assert from 'assert'

import * as _ from 'lodash'

type Interval = [number, number]

function mergeIntervals(intervals: Interval[]): Interval[] {
  const stack: Interval[] = [[-Infinity, -Infinity]]

  intervals
    .sort((range1, range2) => range1[0] - range2[0])
    .forEach((interval) => {
      const lastInterval: Interval = stack.pop()
      if (interval[0] <= lastInterval[1] + 1) {
        stack.push([lastInterval[0], Math.max(interval[1], lastInterval[1])])
      } else {
        stack.push(lastInterval)
        stack.push(interval)
      }
    })
  return stack.slice(1)
}

class RangeSet {
  private ranges: Array<[number, number]>

  /**
   * Constructor for a RangeSet.
   */
  public constructor() {
    this.reset()
  }

  /**
   * Resets the state of a RangeSet.
   */
  public reset(): void {
    this.ranges = []
  }

  /**
   * Output all ranges in the RangeSet.
   *
   * @returns String representation of all ranges in the set.
   */
  public serialize(): string {
    return this.ranges
      .map((range) => `${range[0].toString()}-${range[1].toString()}`)
      .join(',')
  }

  /**
   * Adds a range to the RangeSet.
   *
   * @param start - Start of the range to add.
   * @param end - End of the range to add.
   */
  public addRange(start: number, end: number): void {
    assert.ok(start <= end, `invalid range ${start} <= ${end}`)
    this.ranges = mergeIntervals(this.ranges.concat([[start, end]]))
  }

  /**
   * Add a value to the RangeSet.
   *
   * @param value - Value to add to the RangeSet.
   */
  public addValue(value: number): void {
    this.addRange(value, value)
  }

  /**
   * Parse a string and add it to the RangeSet.
   *
   * @param rangesString - String to parse into a range, and add to RangeSet.
   */
  public parseAndAddRanges(rangesString: string): void {
    const rangeStrings = rangesString.split(',')
    rangeStrings.forEach((rangeString) => {
      const range = rangeString.split('-').map(Number)
      this.addRange(range[0], range.length === 1 ? range[0] : range[1])
    })
  }

  /**
   * Check if a range is contained in the RangeSet.
   *
   * @param start - Start of range to check.
   * @param end - End of range to check.
   * @returns True if RangeSet containst the range.
   */
  public containsRange(start: number, end: number): boolean {
    return this.ranges.some((range) => range[0] <= start && range[1] >= end)
  }

  /**
   * Check if a value is in the RangeSet.
   *
   * @param value - Value to check.
   * @returns True if value is in RangeSet.
   */
  public containsValue(value: number): boolean {
    return this.containsRange(value, value)
  }
}

export default RangeSet
