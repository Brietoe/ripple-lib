import { Client } from "xrpl-local";
import {
  FormattedOrderSpecification,
  SignedTransaction,
} from "xrpl-local/common/types/objects";

import { walletAddress } from "./wallet";

const masterAccount = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
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
  const order = await client.prepareOrder(address, specification);
  const signedOrder = client.sign(order.txJSON, secret);
  await client.request({
    command: "submit",
    tx_blob: signedOrder.signedTransaction,
  });
  await ledgerAccept(client);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- This function is actually returning any
export async function ledgerAccept(client: Client): Promise<any> {
  const request = { command: "ledger_accept" };
  return client.connection.request(request);
}

interface PaymentSpecification {
  source: {
    address: string;
    maxAmount: {
      value: string;
      currency: string;
      counterparty?: string;
    };
  };
  destination: {
    address: string;
    amount: {
      value: string;
      currency: string;
      counterparty?: string;
    };
  };
}

// eslint-disable-next-line max-params -- This many parameters is useful for abstracting this logic
export async function pay(
  client: Client,
  from: string,
  to: string,
  amount: string,
  secret: string,
  currency = "XRP",
  counterparty: string | null = null
): Promise<string> {
  const paymentSpecification: PaymentSpecification = {
    source: {
      address: from,
      maxAmount: {
        value: amount,
        currency,
      },
    },
    destination: {
      address: to,
      amount: {
        value: amount,
        currency,
      },
    },
  };

  if (counterparty != null) {
    paymentSpecification.source.maxAmount.counterparty = counterparty;
    paymentSpecification.destination.amount.counterparty = counterparty;
  }

  let id = "";
  return (
    client
      .preparePayment(from, paymentSpecification, {})
      .then((data: { txJSON: string }) => client.sign(data.txJSON, secret))
      .then(async (signed: SignedTransaction) => {
        id = signed.id;
        return client.request({
          command: "submit",
          tx_blob: signed.signedTransaction,
        });
      })
      // TODO: add better error handling here
      .then(async () => ledgerAccept(client))
      .then(() => id)
  );
}

// eslint-disable-next-line max-params -- Most of these are default parameters
export async function payTo(
  client: Client,
  to: string,
  amount = "4003218",
  currency = "XRP",
  counterparty: string | null = null
): Promise<string> {
  return pay(
    client,
    masterAccount,
    to,
    amount,
    masterSecret,
    currency,
    counterparty
  );
}
