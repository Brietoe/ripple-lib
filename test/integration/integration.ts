/* eslint-disable no-console -- The console logs help debug failing tests */
import assert from "assert";

import _ from "lodash";
import { isValidXAddress } from "ripple-address-codec";

import { Client } from "xrpl-local";
import { errors } from "xrpl-local/common";
import { FormattedOrderSpecification } from "xrpl-local/common/types/objects";
import { isValidSecret } from "xrpl-local/utils";

import { JsonObject } from "../../ripple-binary-codec/src/types/serialized-type";
import TransactionMetadata from "../../src/models/transactions/metadata";
import { generateXAddress } from "../../src/utils/generateAddress";
import requests from "../fixtures/requests";

import { payTo, ledgerAccept } from "./utils";
import wallet from "./wallet";

// how long before each test case times out
const TIMEOUT = 20000;
// how long to wait between checks for validated ledger
const INTERVAL = 1000;

// eslint-disable-next-line node/no-process-env -- This allows the user to pass in a custom ip
const HOST = process.env.HOST ?? "0.0.0.0";
// eslint-disable-next-line node/no-process-env -- This allows the user to pass in a port
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
  options: { minLedgerVersion: any; maxLedgerVersion?: any },
  txData: JsonObject,
  account: string
): Promise<any> {
  console.log("VERIFY...");
  const client: Client = testcase.client;
  return client
    .request({
      command: "tx",
      transaction: hash,
      min_ledger: options.minLedgerVersion,
      max_ledger: options.maxLedgerVersion,
    })
    .then((data) => {
      assert(data);
      assert(data.result);
      assert.strictEqual(data.result.TransactionType, type);
      assert.strictEqual(data.result.Account, account);
      const metaResult: string | TransactionMetadata = data.result.meta;
      if (typeof metaResult === "object") {
        assert.strictEqual(metaResult.TransactionResult, "tesSUCCESS");
      } else {
        assert.strictEqual(metaResult, "tesSUCCESS");
      }
      if (testcase.transactions != null) {
        testcase.transactions.push(hash);
      }
      return { txJSON: JSON.stringify(txData), id: hash, tx: data };
    })
    .catch(async (error) => {
      if (error instanceof errors.PendingLedgerVersionError) {
        console.log("NOT VALIDATED YET...");
        return new Promise((resolve, reject) => {
          setTimeout(
            async () =>
              verifyTransaction(
                testcase,
                hash,
                type,
                options,
                txData,
                account
              ).then(resolve, reject),
            INTERVAL
          );
        });
      }
      console.log(error.stack);
      assert(false, `Transaction not successful: ${error.message}`);
    });
}

async function testTransaction(
  testcase: Mocha.Context,
  type: string,
  lastClosedLedgerVersion: number,
  prepared: { txJSON: string },
  address = wallet.getAddress(),
  secret = wallet.getSecret()
): Promise<any> {
  const txJSON = prepared.txJSON;
  assert(txJSON, "missing txJSON");
  const txData = JSON.parse(txJSON);
  assert.strictEqual(txData.Account, address);
  const client: Client = testcase.client;
  const signedData = client.sign(txJSON, secret);
  console.log("PREPARED...");
  return client
    .request({ command: "submit", tx_blob: signedData.signedTransaction })
    .then((response) => {
      assert(testcase.test, "Missing testcase.test");
      return testcase.test.title.includes("multisign")
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

function setup(this: any, server = serverUrl): void {
  this.client = new Client(server);
  console.log("CONNECTING...");
  return this.client.connect().then(
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
      if (address === wallet.getAddress()) {
        testcase.transactions.push(signed.id);
      }
      return client.request({
        command: "submit",
        tx_blob: signed.signedTransaction,
      });
    })
    .then(() => ledgerAccept(client));
  return trust;
}

// eslint-disable-next-line max-params -- The extra parameter let's us abstract away the promise logic
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
    .then(() => ledgerAccept(client));
}

function setupAccounts(testcase: Mocha.Context) {
  const client: Client = testcase.client;

  const promise = payTo(client, "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM")
    .then(() => payTo(client, wallet.getAddress()))
    .then(() => payTo(client, testcase.newWallet.xAddress))
    .then(() => payTo(client, "rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc"))
    .then(() => payTo(client, "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"))
    .then(async () => {
      return client
        .prepareSettings(masterAccount, { defaultRipple: true })
        .then((data) => client.sign(data.txJSON, masterSecret))
        .then(async (signed) =>
          client.request({
            command: "submit",
            tx_blob: signed.signedTransaction,
          })
        )
        .then(() => ledgerAccept(client));
    })
    .then(async () =>
      makeTrustLine(testcase, wallet.getAddress(), wallet.getSecret())
    )
    .then(async () =>
      makeTrustLine(
        testcase,
        testcase.newWallet.xAddress,
        testcase.newWallet.secret
      )
    )
    .then(() => payTo(client, wallet.getAddress(), "123", "USD", masterAccount))
    .then(() => payTo(client, "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"))
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
        testcase.client,
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

async function tearDown(this: any): Promise<void> {
  const client: Client = this.client;
  return client.disconnect();
}

function suiteSetup(this: any) {
  this.transactions = [];

  return (
    setup
      .bind(this)(serverUrl)
      .then(() => ledgerAccept(this.client))
      .then(() => (this.newWallet = generateXAddress()))
      // two times to give time to server to send `ledgerClosed` event
      // so getLedgerVersion will return right value
      .then(() => ledgerAccept(this.client))
      .then(() =>
        this.client
          .request({
            command: "ledger",
            ledger_index: "validated",
          })
          .then((response) => response.result.ledger_index)
      )
      .then((ledgerVersion) => {
        this.startLedgerVersion = ledgerVersion;
      })
      .then(() => setupAccounts(this))
      .then(async () => tearDown.bind(this)())
  );
}

describe("integration tests", function () {
  const address = wallet.getAddress();
  const instructions = { maxLedgerVersionOffset: 10 };
  this.timeout(TIMEOUT);

  before(suiteSetup);
  beforeEach(_.partial(setup, serverUrl));
  afterEach(tearDown);

  it("trustline", function () {
    return this.client
      .request({
        command: "ledger",
        ledger_index: "validated",
      })
      .then((response) => response.result.ledger_index)
      .then((ledgerVersion) => {
        return this.client
          .prepareTrustline(
            address,
            requests.prepareTrustline.simple,
            instructions
          )
          .then(async (prepared) =>
            testTransaction(this, "TrustSet", ledgerVersion, prepared)
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
      .then((response) => response.result.ledger_index)
      .then((ledgerVersion) => {
        return this.client
          .preparePayment(address, paymentSpecification, instructions)
          .then(async (prepared) =>
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
      .then((response) => response.result.ledger_index)
      .then((ledgerVersion) => {
        return this.client
          .prepareOrder(address, orderSpecification, instructions)
          .then(async (prepared) =>
            testTransaction(this, "OfferCreate", ledgerVersion, prepared)
          )
          .then((result) => {
            const txData = JSON.parse(result.txJSON);
            return this.client
              .request({
                command: "account_offers",
                account: address,
              })
              .then((response) => response.result.offers)
              .then((orders) => {
                assert(orders && orders.length > 0);
                const createdOrder = orders.filter((order) => {
                  return order.seq === txData.Sequence;
                })[0];
                assert(createdOrder);
                delete createdOrder.seq;
                assert.deepEqual(createdOrder, expectedOrder);
                return txData;
              });
          })
          .then((txData) =>
            this.client
              .prepareOrderCancellation(
                address,
                { orderSequence: txData.Sequence },
                instructions
              )
              .then(async (prepared) =>
                testTransaction(this, "OfferCancel", ledgerVersion, prepared)
              )
          );
      });
  });

  it("isConnected", function () {
    assert(this.client.isConnected());
  });

  it("getFee", function () {
    return this.client.getFee().then((fee) => {
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
    return client.getTrustlines(address, options).then((data) => {
      assert(data && data.length > 0 && data[0] && data[0].specification);
      const specification = data[0].specification;
      assert.strictEqual(Number(specification.limit), Number(fixture.limit));
      assert.strictEqual(specification.currency, fixture.currency);
      assert.strictEqual(specification.counterparty, fixture.counterparty);
    });
  });

  it("getBalances", function () {
    const fixture = requests.prepareTrustline.simple;
    const { currency, counterparty } = fixture;
    const options = { currency, counterparty };
    return this.client.getBalances(address, options).then((data) => {
      assert(data && data.length > 0 && data[0]);
      assert.strictEqual(data[0].currency, fixture.currency);
      assert.strictEqual(data[0].counterparty, fixture.counterparty);
    });
  });

  it("getOrderbook", function () {
    const orderbook = {
      base: {
        currency: "XRP",
      },
      counter: {
        currency: "USD",
        counterparty: masterAccount,
      },
    };
    return this.client.getOrderbook(address, orderbook).then((book) => {
      assert(book && book.bids && book.bids.length > 0);
      assert(book.asks && book.asks.length > 0);
      const bid = book.bids[0];
      assert(bid && bid.specification && bid.specification.quantity);
      assert(bid.specification.totalPrice);
      assert.strictEqual(bid.specification.direction, "buy");
      assert.strictEqual(bid.specification.quantity.currency, "XRP");
      assert.strictEqual(bid.specification.totalPrice.currency, "USD");
      const ask = book.asks[0];
      assert(ask && ask.specification && ask.specification.quantity);
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
    assert(newWallet && newWallet.xAddress && newWallet.secret);
    assert(isValidXAddress(newWallet.xAddress));
    assert(isValidSecret(newWallet.secret));
  });
});

describe("integration tests - standalone rippled", function () {
  const instructions = { maxLedgerVersionOffset: 10 };
  this.timeout(TIMEOUT);

  beforeEach(_.partial(setup, serverUrl));
  afterEach(tearDown);
  const address = "r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs";
  const secret = "ss6F8381Br6wwpy9p582H8sBt19J3";
  const signer1address = "rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2";
  const signer1secret = "shK6YXzwYfnFVn3YZSaMh5zuAddKx";
  const signer2address = "r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud";
  const signer2secret = "shUHQnL4EH27V4EiBrj6EfhWvZngF";

  it("submit multisigned transaction", function () {
    const signers = {
      threshold: 2,
      weights: [
        { address: signer1address, weight: 1 },
        { address: signer2address, weight: 1 },
      ],
    };
    let minLedgerVersion = null;
    return payTo(this.client, address)
      .then(() => {
        return this.client
          .request({
            command: "ledger",
            ledger_index: "validated",
          })
          .then((response) => response.result.ledger_index)
          .then((ledgerVersion) => {
            minLedgerVersion = ledgerVersion;
            return this.client
              .prepareSettings(address, { signers }, instructions)
              .then(async (prepared) => {
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
          .then((prepared) => {
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
              .then(async (response) =>
                acceptLedger(this.client).then(() => response)
              )
              .then(async (response) => {
                assert.strictEqual(response.result.engine_result, "tesSUCCESS");
                const options = { minLedgerVersion };
                return verifyTransaction(
                  this,
                  combined.id,
                  "AccountSet",
                  options,
                  {},
                  address
                );
              })
              .catch((error) => {
                console.log(error.message);
                throw error;
              });
          });
      });
  });
});
