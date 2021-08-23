/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Because they come in over the WS connection
 * after-the-fact.
 */
class ConnectionManager {
  private promisesAwaitingConnection: Array<{
    resolve: () => void
    reject: (err: Error) => void
  }> = []

  /**
   * Resolves all awaiting promises.
   */
  public resolveAllAwaiting(): void {
    this.promisesAwaitingConnection.map(({resolve}) => resolve())
    this.promisesAwaitingConnection = []
  }

  /**
   * Rejects all outstanding promises.
   *
   * @param error - Error to reject promises with.
   */
  public rejectAllAwaiting(error: Error): void {
    this.promisesAwaitingConnection.map(({reject}) => reject(error))
    this.promisesAwaitingConnection = []
  }

  /**
   * Await a connection to a server.
   *
   * @returns A promise that resolves when the client connects.
   */
  public async awaitConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.promisesAwaitingConnection.push({resolve, reject})
    })
  }
}

export default ConnectionManager
