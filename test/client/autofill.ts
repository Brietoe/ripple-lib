import { assert } from "chai";

import {
  AccountDelete,
  EscrowFinish,
  Payment,
  Transaction,
} from "../../src/models/transactions";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";

const Fee = "10";
const Sequence = 1432;
const LastLedgerSequence = 2908734;

describe("client.autofill", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("should not autofill if fields are present", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      Sequence,
      LastLedgerSequence,
    };
    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Fee, Fee);
    assert.strictEqual(txResult.Sequence, Sequence);
    assert.strictEqual(txResult.LastLedgerSequence, LastLedgerSequence);
  });

  it("converts Account & Destination X-address to their classic address", async function () {
    const tx: Payment = {
      TransactionType: "Payment",
      Account: "XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi",
      Amount: "1234",
      Destination: "X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ",
    };
    this.mockRippled.addResponse("account_info", rippled.account_info.normal);
    this.mockRippled.addResponse("server_info", rippled.server_info.normal);
    this.mockRippled.addResponse("ledger", rippled.ledger.normal);

    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Account, "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf");
    assert.strictEqual(
      txResult.Destination,
      "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59"
    );
  });

  it("should autofill Sequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      LastLedgerSequence,
    };
    this.mockRippled.addResponse("account_info", {
      status: "success",
      type: "response",
      result: {
        account_data: {
          Sequence: 23,
        },
      },
    });
    const txResult = await this.client.autofill(tx);

    assert.strictEqual(txResult.Sequence, 23);
  });

  describe("when autofill Fee is missing", function () {
    it("should autofill Fee of a Transaction", async function () {
      const tx: Transaction = {
        TransactionType: "DepositPreauth",
        Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
        Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
        Sequence,
        LastLedgerSequence,
      };
      this.mockRippled.addResponse("server_info", {
        status: "success",
        type: "response",
        result: {
          info: {
            validated_ledger: {
              base_fee_xrp: 0.00001,
            },
          },
        },
      });
      const txResult = await this.client.autofill(tx);

      assert.strictEqual(txResult.Fee, "12");
    });

    it("should autofill Fee of an EscrowFinish transaction", async function () {
      const tx: EscrowFinish = {
        Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        TransactionType: "EscrowFinish",
        Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        OfferSequence: 7,
        Condition:
          "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
        Fulfillment: "A0028000",
      };
      this.mockRippled.addResponse("account_info", rippled.account_info.normal);
      this.mockRippled.addResponse("ledger", rippled.ledger.normal);
      this.mockRippled.addResponse("server_info", {
        status: "success",
        type: "response",
        result: {
          info: {
            validated_ledger: {
              base_fee_xrp: 0.00001,
            },
          },
        },
      });
      const txResult = await this.client.autofill(tx);

      assert.strictEqual(txResult.Fee, "399");
    });

    it("should autofill Fee of an AccountDelete transaction", async function () {
      const tx: AccountDelete = {
        Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        TransactionType: "AccountDelete",
        Destination: "X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ",
      };
      this.mockRippled.addResponse("account_info", rippled.account_info.normal);
      this.mockRippled.addResponse("ledger", rippled.ledger.normal);
      this.mockRippled.addResponse("server_info", {
        status: "success",
        type: "response",
        result: {
          info: {
            validated_ledger: {
              base_fee_xrp: 0.00001,
            },
          },
        },
      });
      const txResult = await this.client.autofill(tx);

      assert.strictEqual(txResult.Fee, "5000000");
    });

    it("should autofill Fee of an EscrowFinish transaction with signersCount", async function () {
      const tx: EscrowFinish = {
        Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        TransactionType: "EscrowFinish",
        Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
        OfferSequence: 7,
        Condition:
          "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
        Fulfillment: "A0028000",
      };
      this.mockRippled.addResponse("account_info", rippled.account_info.normal);
      this.mockRippled.addResponse("ledger", rippled.ledger.normal);
      this.mockRippled.addResponse("server_info", {
        status: "success",
        type: "response",
        result: {
          info: {
            validated_ledger: {
              base_fee_xrp: 0.00001,
            },
          },
        },
      });
      const txResult = await this.client.autofill(tx, 4);

      assert.strictEqual(txResult.Fee, "459");
    });
  });

  it("should autofill LastLedgerSequence when it's missing", async function () {
    const tx: Transaction = {
      TransactionType: "DepositPreauth",
      Account: "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
      Authorize: "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      Fee,
      Sequence,
    };
    this.mockRippled.addResponse("ledger", {
      status: "success",
      type: "response",
      result: {
        ledger_index: 9038214,
      },
    });
    const txResult = await this.client.autofill(tx);
    assert.strictEqual(txResult.LastLedgerSequence, 9038234);
  });
});
