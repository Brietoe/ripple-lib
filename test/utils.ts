import fs from 'fs'
import net from 'net'
import path from 'path'

import {Client} from '../src'

/**
 * The test function. It takes a Client object and then some other data to
 * test (currently: an address). May be called multiple times with different
 * arguments, to test different types of data.
 */
type TestFn = (client: Client, address: string) => void | PromiseLike<void>

/**
 * A suite of tests to run. Maps the test name to the test function.
 */
export interface TestSuite {
  [testName: string]: TestFn
}

/**
 * When the test suite is loaded, we represent it with the following
 * data structure containing tests and metadata about the suite.
 * If no test suite exists, we return this object with `isMissing: true`
 * so that we can report it.
 */
interface LoadedTestSuite {
  name: string
  tests: Array<[string, TestFn]>
  config: {
    skipXAddress?: boolean
  }
}

/**
 * Finds a free Port on the system.
 *
 * @returns An error if port is not free, else a free port.
 */
export async function getFreePort(): Promise<Error | number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let port: number | undefined
    server.on('listening', function () {
      const addr = server.address()
      port = typeof addr === 'string' ? port : addr.port
      server.close()
    })
    server.on('close', function () {
      resolve(port)
    })
    server.on('error', function (error) {
      reject(error)
    })
    server.listen(0)
  })
}

export function getAllPublicMethods(client: Client): string[] {
  return Array.from(
    new Set([
      ...Object.getOwnPropertyNames(client),
      ...Object.getOwnPropertyNames(Client.prototype)
    ])
  ).filter((key) => !key.startsWith('_'))
}

export function loadTestSuites(): LoadedTestSuite[] {
  const allTests: string[] = fs.readdirSync(path.join(__dirname, 'client'), {
    encoding: 'utf8'
  })
  return allTests
    .map((methodName: string): LoadedTestSuite => {
      if (methodName.startsWith('.DS_Store')) {
        return null
      }
      const testSuite: TestSuite = require(`./client/${methodName}`)
      const loaded: LoadedTestSuite = {
        name: methodName,
        config: testSuite.config,
        tests: Object.entries(testSuite.default)
      }
      return loaded
    })
    .filter(Boolean)
}

/**
 * Ignore WebSocket DisconnectErrors. Useful for making requests where we don't
 * care about the response and plan to teardown the test before the response
 * has come back.
 *
 * @param error - Error from the WebSocket Disconnect.
 * @throws Error if Error is not "websocket was closed".
 */
export function ignoreWebSocketDisconnect(error: Error): void {
  if (error.message === 'websocket was closed') {
    return
  }
  throw error
}
