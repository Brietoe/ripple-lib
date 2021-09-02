/* eslint-disable no-console -- Console comments make it easier to debug when tests fail */
import assert from "assert";

import _ from "lodash";
import { isValidXAddress } from "ripple-address-codec";

import { errors } from "xrpl-local/common";
import { FormattedOrderSpecification } from "xrpl-local/common/types/objects";
import { isValidSecret } from "xrpl-local/utils";

import { JsonObject } from "../../ripple-binary-codec/dist/types/serialized-type";
import { LedgerResponse, Prepare, TxResponse } from "../../src";
import { Client } from "../../src/client";
import { generateXAddress } from "../../src/utils/generateAddress";
import requests from "../fixtures/requests";

import { payTo, ledgerAccept } from "./utils";
import { walletAddress, walletSecret } from "./wallet";

// how long before each test case times out
const TIMEOUT = 20000;
// how long to wait between checks for validated ledger
const INTERVAL = 1000;

// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different IP's for local rippled
const HOST = process.env.HOST ?? "0.0.0.0";
// eslint-disable-next-line node/no-process-env -- Allows the user to pass in different ports for local rippled
const PORT = process.env.PORT ?? "6006";
const serverUrl = `ws://${HOST}:${PORT}`;

console.log(serverUrl);

async function acceptLedger(client: Client): Promise<any> {
  return client.connection.request({ command: "ledger_accept" });
}

async function verifyTransaction(
  testcase: Mocha.Context,
  hash: string,
  type: string,
  options: { minLedgerVersion?: number; maxLedgerVersion?: number },
  txData: JsonObject,
  account: string
): Promise<void> {
  console.log("VERIFY...");
  const client: Client = testcase.client;
  let data: TxResponse;
  try {
    data = await client.request({
      command: "tx",
      transaction: hash,
      min_ledger: options.minLedgerVersion,
      max_ledger: options.maxLedgerVersion,
    });

    assert(data.result);
    assert.strictEqual(data.result.TransactionType, type);
    assert.strictEqual(data.result.Account, account);
    if (typeof data.result.meta === "object") {
      assert.strictEqual(data.result.meta.TransactionResult, "tesSUCCESS");
    } else {
      assert.strictEqual(data.result.meta, "tesSUCCESS");
    }
    if (testcase.transactions != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Is better than setting type by extracting to variable
      testcase.transactions.push(hash);
    }
  } catch (error) {
    if (error instanceof errors.PendingLedgerVersionError) {
      console.log("NOT VALIDATED YET...");
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          verifyTransaction(
            testcase,
            hash,
            type,
            options,
            txData,
            account
          ).then(resolve, reject);
        }, INTERVAL);
      });
    } else {
      console.log(error.stack);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- All errors have messages
      assert(false, `Transaction not successful: ${error.message}`);
    }
  }
}

async function testTransaction(
  testcase: Mocha.Context,
  type: string,
  lastClosedLedgerVersion: number | null,
  prepared: Prepare,
  address = walletAddress,
  secret = walletSecret
) {
  const txJSON = prepared.txJSON;
  assert(txJSON, "missing txJSON");
  const txData = JSON.parse(txJSON);
  assert.strictEqual(txData.Account, address);
  const client: Client = testcase.client;
  const signedData = client.sign(txJSON, secret);
  console.log("PREPARED...");
  return client
    .request({ command: "submit", tx_blob: signedData.signedTransaction })
    .then(async (response) => {
      return testcase.test?.title.includes("multisign")
        ? acceptLedger(client).then(() => response)
        : response;
    })
    .then(async (response) => {
      console.log("SUBMITTED...");
      assert.strictEqual(response.result.engine_result, "tesSUCCESS");
      const options = {
        minLedgerVersion: lastClosedLedgerVersion,
        maxLedgerVersion: txData.LastLedgerSequence,
      };
      ledgerAccept(testcase.client);
      return new Promise((resolve, reject) => {
        setTimeout(
          async () =>
            verifyTransaction(
              testcase,
              signedData.id,
              type,
              options,
              txData,
              address
            ).then(resolve, reject),
          INTERVAL
        );
      });
    });
}

async function setupClient(this: any, server = serverUrl) {
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

const masterAccount = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const masterSecret = "snoPBrXtMeMyMHUVTgbuqAfg1SUTb";

async function makeTrustLine(
  testcase: Mocha.Context,
  address: string,
  secret: string
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

async function makeOrder(
  client: Client,
  address: string,
  specification: FormattedOrderSpecification,
  secret: string
): Promise<any> {
  return client
    .prepareOrder(address, specification)
    .then((data) => client.sign(data.txJSON, secret))
    .then(async (signed) =>
      client.request({ command: "submit", tx_blob: signed.signedTransaction })
    )
    .then(async () => ledgerAccept(client));
}

async function setupAccounts(testcase: Mocha.Context) {
  const client: Client = testcase.client;

  // TODO: payTo has Promise<SubmitResponse> type
  const promise = payTo(client, "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM")
    .then(async () => payTo(client, walletAddress))
    .then(async () => payTo(client, testcase.newWallet.xAddress))
    .then(async () => payTo(client, "rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc"))
    .then(async () => payTo(client, "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"))
    .then(async () => {
      return client
        .prepareSettings(masterAccount, { defaultRipple: true })
        .then((data: { txJSON: any }) => client.sign(data.txJSON, masterSecret))
        .then(async (signed: { signedTransaction: any }) =>
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
      return makeOrder(
        testcase.client,
        masterAccount,
        orderSpecification,
        masterSecret
      );
    });
  return promise;
}

async function teardownClient(this: any): Promise<void> {
  const client: Client = this.client;
  return client.disconnect();
}

async function suiteSetup(this: any): Promise<void> {
  this.transactions = [];

  // TODO: Figure out if this should be setup (Implicitly defined somewhere), or setupClient (Local definition)
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
// return (
//   setupClient
//     .bind(this)(serverUrl)
//     .then(async () => ledgerAccept(this.client))
//     .then(async () => (this.newWallet = generateXAddress()))
//     // two times to give time to server to send `ledgerClosed` event
//     // so getLedgerVersion will return right value
//     .then(async () => ledgerAccept(this.client))
//     .then(() =>
//       this.client
//         .request({
//           command: "ledger",
//           ledger_index: "validated",
//         })
//         .then(
//           (response: { result: { ledger_index: any } }) =>
//             response.result.ledger_index
//         )
//     )
//     .then((ledgerVersion) => {
//       this.startLedgerVersion = ledgerVersion;
//     })
//     .then(async () => setupAccounts(this))
//     .then(async () => teardownClient.bind(this)())
// );
// }

describe("integration tests", function () {
  const address = walletAddress;
  const instructions = { maxLedgerVersionOffset: 10 };
  this.timeout(TIMEOUT);

  before(suiteSetup);
  beforeEach(_.partial(setupClient, serverUrl));
  afterEach(teardownClient);

  it("trustline", async function () {
    const client: Client = this.client;

    return client
      .request({
        command: "ledger",
        ledger_index: "validated",
      })
      .then((response) => response.result.ledger_index)
      .then(async (ledgerVersion) => {
        return (
          client
            .prepareTrustline(
              address,
              requests.prepareTrustline.simple,
              instructions
            )
            // eslint-disable-next-line max-nested-callbacks -- The fourth layer doesn't add much complexity
            .then(async (prepared) =>
              testTransaction(this, "TrustSet", ledgerVersion, prepared)
            )
        );
      });
  });

  it("payment", function () {
    const amount = { currency: "XRP", value: "0.000001" };
    const paymentSpecification = {
      source: {
        address,
        maxAmount: amount,
      },
      destination: {
        address: "rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc",
        amount,
      },
    };
    return this.client
      .request({
        command: "ledger",
        ledger_index: "validated",
      })
      .then(
        (response: { result: { ledger_index: any } }) =>
          response.result.ledger_index
      )
      .then((ledgerVersion: number) => {
        return this.client
          .preparePayment(address, paymentSpecification, instructions)
          .then(async (prepared: Prepare) =>
            testTransaction(this, "Payment", ledgerVersion, prepared)
          );
      });
  });

  it("order", function () {
    const orderSpecification = {
      direction: "buy",
      quantity: {
        currency: "USD",
        value: "237",
        counterparty: "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
      },
      totalPrice: {
        currency: "XRP",
        value: "0.0002",
      },
    };
    const expectedOrder = {
      flags: 0,
      quality: "1.185",
      taker_gets: "200",
      taker_pays: {
        currency: "USD",
        value: "237",
        issuer: "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
      },
    };
    return this.client
      .request({
        command: "ledger",
        ledger_index: "validated",
      })
      .then(
        (response: { result: { ledger_index: any } }) =>
          response.result.ledger_index
      )
      .then((ledgerVersion: number) => {
        return this.client
          .prepareOrder(address, orderSpecification, instructions)
          .then(async (prepared: Prepare) =>
            testTransaction(this, "OfferCreate", ledgerVersion, prepared)
          )
          .then((result: { txJSON: string }) => {
            const txData = JSON.parse(result.txJSON);
            return this.client
              .request({
                command: "account_offers",
                account: address,
              })
              .then(
                (response: { result: { offers: any } }) =>
                  response.result.offers
              )
              .then((orders: any[]) => {
                assert(orders && orders.length > 0);
                const createdOrder = orders.filter((order: { seq: any }) => {
                  return order.seq === txData.Sequence;
                })[0];
                assert(createdOrder);
                delete createdOrder.seq;
                assert.deepEqual(createdOrder, expectedOrder);
                return txData;
              });
          })
          .then((txData: { Sequence: any }) =>
            this.client
              .prepareOrderCancellation(
                address,
                { orderSequence: txData.Sequence },
                instructions
              )
              .then(async (prepared: Prepare) =>
                testTransaction(this, "OfferCancel", ledgerVersion, prepared)
              )
          );
      });
  });

  it("isConnected", function () {
    const client: Client = this.client;
    assert(client.isConnected());
  });

  it("getFee", async function () {
    const client: Client = this.client;
    return client.getFee().then((fee: string) => {
      assert.strictEqual(typeof fee, "string");
      assert(!isNaN(Number(fee)));
      assert(parseFloat(fee) === Number(fee));
    });
  });

  it("getTrustlines", async function () {
    const fixture = requests.prepareTrustline.simple;
    const { currency, counterparty } = fixture;
    const options = { currency, counterparty };
    const client: Client = this.client;
    return client
      .getTrustlines(address, options)
      .then((data: string | any[]) => {
        assert(data && data.length > 0 && data[0] && data[0].specification);
        const specification = data[0].specification;
        assert.strictEqual(Number(specification.limit), Number(fixture.limit));
        assert.strictEqual(specification.currency, fixture.currency);
        assert.strictEqual(specification.counterparty, fixture.counterparty);
      });
  });

  it("getBalances", async function () {
    const fixture = requests.prepareTrustline.simple;
    const { currency, counterparty } = fixture;
    const options = { currency, counterparty };
    const client: Client = this.client;
    return client.getBalances(address, options).then((data: string | any[]) => {
      assert(data && data.length > 0 && data[0]);
      assert.strictEqual(data[0].currency, fixture.currency);
      assert.strictEqual(data[0].counterparty, fixture.counterparty);
    });
  });

  it("getOrderbook", async function () {
    const orderbook = {
      base: {
        currency: "XRP",
      },
      counter: {
        currency: "USD",
        counterparty: masterAccount,
      },
    };
    const client: Client = this.client;
    return client.getOrderbook(address, orderbook).then((book) => {
      assert(book.bids.length > 0);
      assert(book.asks.length > 0);
      const bid = book.bids[0];
      assert(bid.specification.quantity);
      assert(bid.specification.totalPrice);
      assert.strictEqual(bid.specification.direction, "buy");
      assert.strictEqual(bid.specification.quantity.currency, "XRP");
      assert.strictEqual(bid.specification.totalPrice.currency, "USD");
      const ask = book.asks[0];
      assert(ask.specification.quantity);
      assert(ask.specification.totalPrice);
      assert.strictEqual(ask.specification.direction, "sell");
      assert.strictEqual(ask.specification.quantity.currency, "XRP");
      assert.strictEqual(ask.specification.totalPrice.currency, "USD");
    });
  });

  // it('getPaths', function () {
  //   const pathfind = {
  //     source: {
  //       address: address
  //     },
  //     destination: {
  //       address: this.newWallet.address,
  //       amount: {
  //         value: '1',
  //         currency: 'USD',
  //         counterparty: masterAccount
  //       }
  //     }
  //   }
  //   return this.client.getPaths(pathfind).then((data) => {
  //     assert(data && data.length > 0)
  //     const path = data[0]
  //     assert(path && path.source)
  //     assert.strictEqual(path.source.address, address)
  //     assert(path.paths && path.paths.length > 0)
  //   })
  // })

  // it('getPaths - send all', function () {
  //   const pathfind = {
  //     source: {
  //       address: address,
  //       amount: {
  //         currency: 'USD',
  //         value: '0.005'
  //       }
  //     },
  //     destination: {
  //       address: this.newWallet.address,
  //       amount: {
  //         currency: 'USD'
  //       }
  //     }
  //   }

  //   return this.client.getPaths(pathfind).then((data) => {
  //     assert(data && data.length > 0)
  //     assert(
  //       data.every((path) => {
  //         return (
  //           parseFloat(path.source.amount.value) <=
  //           parseFloat(pathfind.source.amount.value)
  //         )
  //       })
  //     )
  //     const path = data[0]
  //     assert(path && path.source)
  //     assert.strictEqual(path.source.address, pathfind.source.address)
  //     assert(path.paths && path.paths.length > 0)
  //   })
  // })

  it("generateWallet", function () {
    const newWallet = generateXAddress();
    assert(newWallet.xAddress);
    assert(newWallet.secret);
    assert(isValidXAddress(newWallet.xAddress));
    assert(isValidSecret(newWallet.secret));
  });
});

// eslint-disable-next-line mocha/max-top-level-suites -- This is a separate test suite which shares a lot of code with above
describe("integration tests - standalone rippled", function () {
  const instructions = { maxLedgerVersionOffset: 10 };
  this.timeout(TIMEOUT);

  beforeEach(_.partial(setupClient, serverUrl));
  afterEach(teardownClient);
  const address = "r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs";
  const secret = "ss6F8381Br6wwpy9p582H8sBt19J3";
  const signer1address = "rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2";
  const signer1secret = "shK6YXzwYfnFVn3YZSaMh5zuAddKx";
  const signer2address = "r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud";
  const signer2secret = "shUHQnL4EH27V4EiBrj6EfhWvZngF";

  it("submit multisigned transaction", async function () {
    const signers = {
      threshold: 2,
      weights: [
        { address: signer1address, weight: 1 },
        { address: signer2address, weight: 1 },
      ],
    };
    let minLedgerVersion: number | null = null;
    return payTo(this.client, address)
      .then(() => {
        return this.client
          .request({
            command: "ledger",
            ledger_index: "validated",
          })
          .then(
            (response: { result: { ledger_index: any } }) =>
              response.result.ledger_index
          )
          .then((ledgerVersion: number | null) => {
            minLedgerVersion = ledgerVersion;
            return this.client
              .prepareSettings(address, { signers }, instructions)
              .then(async (prepared: Prepare) => {
                return testTransaction(
                  this,
                  "SignerListSet",
                  ledgerVersion,
                  prepared,
                  address,
                  secret
                );
              });
          });
      })
      .then(() => {
        const multisignInstructions = { ...instructions, signersCount: 2 };
        return this.client
          .prepareSettings(
            address,
            { domain: "example.com" },
            multisignInstructions
          )
          .then((prepared: { txJSON: any }) => {
            const signed1 = this.client.sign(prepared.txJSON, signer1secret, {
              signAs: signer1address,
            });
            const signed2 = this.client.sign(prepared.txJSON, signer2secret, {
              signAs: signer2address,
            });
            const combined = this.client.combine([
              signed1.signedTransaction,
              signed2.signedTransaction,
            ]);
            return this.client
              .request({
                command: "submit",
                tx_blob: combined.signedTransaction,
              })
              .then(async (response: any) =>
                acceptLedger(this.client).then(() => response)
              )
              .then(
                async (response: { result: { engine_result: unknown } }) => {
                  assert.strictEqual(
                    response.result.engine_result,
                    "tesSUCCESS"
                  );
                  const options = { minLedgerVersion };
                  return verifyTransaction(
                    this,
                    combined.id,
                    "AccountSet",
                    options,
                    {},
                    address
                  );
                }
              )
              .catch((error: { message: any }) => {
                console.log(error.message);
                throw error;
              });
          });
      });
  });
});
