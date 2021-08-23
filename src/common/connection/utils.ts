import WebSocket from 'ws'

import {DisconnectedError} from '../errors'

import {ConnectionOptions} from './connectionConfig'

interface ProxyOverrides {
  secureEndpoint: boolean
  secureProxy: boolean
  auth?: string
  ca?: string[]
  key?: string
  passphrase?: string
  cert?: string
}

type OptionsOverrides = Partial<ProxyOverrides>

function getProxyOverrides(
  config: ConnectionOptions,
  url: URL,
  proxyURL: URL
): ProxyOverrides {
  const overrides: ProxyOverrides = {
    secureEndpoint: url.protocol === 'wss:',
    secureProxy: proxyURL.protocol === 'https:',
    auth: config.proxyAuthorization,
    ca: config.trustedCertificates,
    key: config.key,
    passphrase: config.passphrase,
    cert: config.certificate
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete overrides[key]
    }
  })

  return overrides
}

function getOptionsOverrides(config: ConnectionOptions): OptionsOverrides {
  const overrides: OptionsOverrides = {
    ca: config.trustedCertificates,
    key: config.key,
    passphrase: config.passphrase,
    cert: config.certificate
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete overrides[key]
    }
  })

  return overrides
}

/**
 * Create a new websocket given your URL and optional proxy/certificate
 * configuration.
 *
 * @param url - URL to connect to.
 * @param config - Config with options describing how to connect.
 * @returns A created WebSocket.
 */
export function createWebSocket(
  url: string,
  config: ConnectionOptions
): WebSocket {
  const options: WebSocket.ClientOptions = {}
  if (config.proxy != null) {
    const parsedURL = new URL(url)
    const parsedProxyURL = new URL(config.proxy)

    const proxyOverrides = getProxyOverrides(config, parsedURL, parsedProxyURL)

    const proxyOptions = {...parsedProxyURL, ...proxyOverrides}

    let HttpsProxyAgent
    try {
      HttpsProxyAgent = require('https-proxy-agent')
    } catch (error) {
      throw new Error('"proxy" option is not supported in the browser')
    }
    options.agent = new HttpsProxyAgent(proxyOptions)
  }

  if (config.authorization != null) {
    const base64 = Buffer.from(config.authorization).toString('base64')
    options.headers = {Authorization: `Basic ${base64}`}
  }

  const optionsOverrides = getOptionsOverrides(config)

  const websocketOptions = {...options, ...optionsOverrides}
  const websocket = new WebSocket(url, null, websocketOptions)
  // we will have a listener for each outstanding request,
  // so we have to raise the limit (the default is 10)
  if (typeof websocket.setMaxListeners === 'function') {
    websocket.setMaxListeners(Infinity)
  }

  return websocket
}

/**
 * Ws.send(), but promisified.
 *
 * @param ws - Websocket to send data to.
 * @param message - Message to send.
 * @returns Promise for a Rippled response.
 */
export async function websocketSendAsync(
  ws: WebSocket,
  message: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ws.send(message, undefined, (error?: Error) => {
      if (error === undefined) {
        reject(new DisconnectedError(error.message, error))
      } else {
        resolve()
      }
    })
  })
}
