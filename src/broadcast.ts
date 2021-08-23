import {Client, ClientOptions} from './client'

class ClientBroadcast extends Client {
  public ledgerVersion: number | undefined = undefined
  private readonly clients: Client[]

  /**
   * Constructs a Broadcast client.
   *
   * @param servers - Servers to connect to.
   * @param options - Client Options to specify connection details.
   */
  public constructor(servers: string[], options: ClientOptions = {}) {
    super(options)

    const clients: Client[] = servers.map(
      (server: Client) => new Client(server, options)
    )

    this.clients = clients

    this.getMethodNames().forEach((name: string) => {
      this[name] = async (): Promise<Client> => {
        return Promise.race(
          this.clients.map((client) => client[name](...arguments))
        )
      }
    })

    const defaultClient = clients[0]
    const syncMethods = ['sign', 'generateAddress', 'computeLedgerHash']
    syncMethods.forEach((name) => {
      this[name] = defaultClient[name].bind(defaultClient)
    })

    clients.forEach((client) => {
      client.on('ledger', this.onLedgerEvent.bind(this))
      client.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data)
      )
    })
  }

  public async connect(): Promise<void> {
    await Promise.all(
      this.clients.map(async (client: Client) => client.connect())
    )
  }

  public async disconnect(): Promise<void> {
    await Promise.all(
      this.clients.map(async (client: Client) => client.disconnect())
    )
  }

  public isConnected(): boolean {
    return this.clients.map((client) => client.isConnected()).every(Boolean)
  }

  public onLedgerEvent(ledger: LedgerStream): void {
    if (
      ledger.ledgerVersion > this.ledgerVersion ||
      this.ledgerVersion == null
    ) {
      this.ledgerVersion = ledger.ledgerVersion
      this.emit('ledger', ledger)
    }
  }

  /**
   * Gets names of all methods on clients.
   *
   * @returns Names of all client methods.
   */
  public getMethodNames(): string[] {
    const methodNames: string[] = []
    const client: Client = this.clients[0]
    for (const name of Object.getOwnPropertyNames(client)) {
      if (typeof client[name] === 'function') {
        methodNames.push(name)
      }
    }
    return methodNames
  }
}

export default ClientBroadcast
