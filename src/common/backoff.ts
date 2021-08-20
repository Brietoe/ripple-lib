// Original code based on "backo" - https://github.com/segmentio/backo
// MIT License - Copyright 2014 Segment.io
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const DEFAULT_MIN = 100
const DEFAULT_MAX = 10000
const RANDOM_UPPER = 10
const RANDOM_LOWER = 0

/**
 * A Back off strategy that increases exponentially. Useful with repeated
 * setTimeout calls over a network (where the destination may be down).
 */
class ExponentialBackoff {
  public attempts = 0
  private readonly ms: number
  private readonly max: number
  private readonly factor: number = 2
  private readonly jitter: number = 0

  /**
   * Construct a Backoff object.
   *
   * @param opts - Min and max exponential backoff.
   */
  public constructor(opts: {min?: number; max?: number} = {}) {
    this.ms = opts.min || DEFAULT_MIN
    this.max = opts.max || DEFAULT_MAX
  }

  /**
   * Get the backoff duration.
   *
   * @returns The backoff duration.
   */
  public get duration(): number {
    this.attempts += 1
    let ms = this.ms * this.factor ** this.attempts

    if (this.jitter) {
      // Generate a random number 0-10
      const rand = Math.random() * RANDOM_UPPER + RANDOM_LOWER
      const deviation = Math.floor(rand * this.jitter * ms)
      ms = Math.floor(rand) % 2 === 0 ? ms - deviation : ms + deviation
    }
    return Math.min(ms, this.max)
  }

  /**
   * Reset the number of attempts.
   */
  public reset(): void {
    this.attempts = 0
  }
}

export default ExponentialBackoff
