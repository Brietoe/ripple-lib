import { Client, generateXAddress, LedgerResponse } from "xrpl-local";
import { FormattedOrderSpecification } from "xrpl-local/common/types/objects";

import { ledgerAccept, payTo } from "./utils";
import { walletAddress, walletSecret } from "./wallet";

// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different IP's for local rippled
const HOST = process.env.HOST ?? "0.0.0.0";
// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different ports for local rippled
const PORT = process.env.PORT ?? "6006";
export const serverUrl = `ws://${HOST}:${PORT}`;

export async function setupClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing 'this' doesn't offer much
  this: any,
  server = serverUrl
): Promise<void> {
  this.client = new Client(server);
  console.log("CONNECTING...");
  const client: Client = this.client;
  return client.connect().then(
    () => {
      console.log("CONNECTED...");
    },
    (error) => {
      console.log("ERROR:", error);
      throw error;
    }
  );
}

export const masterAccount = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const masterSecret = "snoPBrXtMeMyMHUVTgbuqAfg1SUTb";

export async function makeTrustLine(
  testcase: Mocha.Context,
  address: string,
  secret: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The return type is legitimately any
): Promise<any> {
  const client: Client = testcase.client;
  const specification = {
    currency: "USD",
    counterparty: masterAccount,
    limit: "1341.1",
    ripplingDisabled: true,
  };
  const trust = client
    .prepareTrustline(address, specification, {})
    .then(async (data) => {
      const signed = client.sign(data.txJSON, secret);
      if (address === walletAddress) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Cleaner to read without additional typing
        testcase.transactions.push(signed.id);
      }
      return client.request({
        command: "submit",
        tx_blob: signed.signedTransaction,
      });
    })
    .then(async () => ledgerAccept(client));
  return trust;
}

// eslint-disable-next-line max-params -- It's worth the extra parameter to simplify the logic
export async function makeOrder(
  client: Client,
  address: string,
  specification: FormattedOrderSpecification,
  secret: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The return type is legitimately any
): Promise<any> {
  return client
    .prepareOrder(address, specification)
    .then((data) => client.sign(data.txJSON, secret))
    .then(async (signed) =>
      client.request({ command: "submit", tx_blob: signed.signedTransaction })
    )
    .then(async () => ledgerAccept(client));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The return type is legitimately any
export async function setupAccounts(testcase: Mocha.Context): Promise<any> {
  const client: Client = testcase.client;

  const promise = payTo(client, "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM")
    .then(async () => payTo(client, walletAddress))
    .then(async () => payTo(client, testcase.newWallet.xAddress))
    .then(async () => payTo(client, "rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc"))
    .then(async () => payTo(client, "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"))
    .then(async () => {
      return client
        .prepareSettings(masterAccount, { defaultRipple: true })
        .then((data: { txJSON: string }) =>
          client.sign(data.txJSON, masterSecret)
        )
        .then(async (signed: { signedTransaction: string }) =>
          client.request({
            command: "submit",
            tx_blob: signed.signedTransaction,
          })
        )
        .then(async () => ledgerAccept(client));
    })
    .then(async () => makeTrustLine(testcase, walletAddress, walletSecret))
    .then(async () =>
      makeTrustLine(
        testcase,
        testcase.newWallet.xAddress,
        testcase.newWallet.secret
      )
    )
    .then(async () => payTo(client, walletAddress, "123", "USD", masterAccount))
    .then(async () => payTo(client, "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"))
    .then(async () => {
      const orderSpecification = {
        direction: "buy",
        quantity: {
          currency: "USD",
          value: "432",
          counterparty: masterAccount,
        },
        totalPrice: {
          currency: "XRP",
          value: "432",
        },
      };
      return makeOrder(
        client,
        testcase.newWallet.xAddress,
        orderSpecification,
        testcase.newWallet.secret
      );
    })
    .then(async () => {
      const orderSpecification = {
        direction: "buy",
        quantity: {
          currency: "XRP",
          value: "1741",
        },
        totalPrice: {
          currency: "USD",
          value: "171",
          counterparty: masterAccount,
        },
      };
      return makeOrder(client, masterAccount, orderSpecification, masterSecret);
    });
  return promise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing 'this' doesn't offer much
export async function teardownClient(this: any): Promise<void> {
  const client: Client = this.client;
  return client.disconnect();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing 'this' doesn't offer much
export async function suiteTestSetup(this: any): Promise<void> {
  this.transactions = [];

  await setupClient.bind(this)(serverUrl);
  const client: Client = this.client;
  await ledgerAccept(client);
  this.newWallet = generateXAddress();
  // two times to give time to server to send `ledgerClosed` event
  // so getLedgerVersion will return right value
  await ledgerAccept(client);
  const response: LedgerResponse = await client.request({
    command: "ledger",
    ledger_index: "validated",
  });
  this.startLedgerVersion = response.result.ledger_index;
  await setupAccounts(this);
  return teardownClient.bind(this)();
}
