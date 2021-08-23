/**
 * ConnectionOptions allows users to pass Configuration options into a connection.
 */
export interface ConnectionOptions {
  trace?: boolean | ((id: string, message: string) => void)
  proxy?: string
  proxyAuthorization?: string
  authorization?: string
  trustedCertificates?: string[]
  key?: string
  passphrase?: string
  certificate?: string
  timeout?: number
  connectionTimeout?: number
}

const DEFAULT_TIMEOUT = 20000
const DEFAULT_CONNECTION_TIMEOUT = 5000

/**
 * Class providing configuration information for a connection. This is where
 * connection defaults can be specified.
 */
export class ConnectionConfig {
  public trace: (id: string, message: string) => void
  public proxy?: string
  public proxyAuthorization?: string
  public authorization?: string
  public trustedCertificates?: string[]
  public key?: string
  public passphrase?: string
  public certificate?: string
  public timeout: number
  public connectionTimeout: number

  /**
   * Construct a Connection Configuration.
   *
   * @param options - Connection options.
   */
  public constructor(options: ConnectionOptions) {
    this.proxy = options.proxy
    this.proxyAuthorization = options.proxyAuthorization
    this.authorization = options.authorization
    this.trustedCertificates = options.trustedCertificates
    this.key = options.key
    this.passphrase = options.passphrase
    this.certificate = options.certificate

    this.timeout = options.timeout || DEFAULT_TIMEOUT
    this.connectionTimeout = options.timeout || DEFAULT_CONNECTION_TIMEOUT

    if (typeof options.trace === 'function') {
      this.trace = options.trace
    } else if (options.trace) {
      this.trace = console.log
    } else {
      this.trace = (): void => {}
    }
  }
}
