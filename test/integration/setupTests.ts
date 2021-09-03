/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- Annoying to resolve and not worth it */
import { Client, generateXAddress } from "xrpl-local";

import { ledgerAccept, payTo, makeOrder, makeTrustLine } from "./utils";
import { walletAddress, walletSecret } from "./wallet";

const DEBUG = false;

// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different IP's for local rippled
const HOST = process.env.HOST ?? "0.0.0.0";
// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different ports for local rippled
const PORT = process.env.PORT ?? "6006";
export const serverUrl = `ws://${HOST}:${PORT}`;

export function log(...args: unknown[]): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Could be set to true
  if (DEBUG) {
    // eslint-disable-next-line no-console -- Printing for debugging purposes
    console.log(...args);
  }
}

export async function setupClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing 'this' doesn't offer much
  this: any,
  server = serverUrl
): Promise<void> {
  this.client = new Client(server);
  log("CONNECTING...");
  const client: Client = this.client;
  return client.connect().then(
    () => {
      log("CONNECTED...");
    },
    (error) => {
      log("ERROR:", error);
      throw error;
    }
  );
}

export const masterAccount = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const masterSecret = "snoPBrXtMeMyMHUVTgbuqAfg1SUTb";

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
  this.newWallet = generateXAddress();
  await setupAccounts(this);
  return teardownClient.bind(this)();
}
