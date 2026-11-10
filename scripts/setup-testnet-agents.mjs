#!/usr/bin/env node
/**
 * Provision dedicated testnet accounts for the hosted agents.
 *
 * This script is intentionally separate from the CLI keychain: hosted agents
 * need their own testnet-only API keys in Worker secrets. It writes:
 *
 *   .secrets/testnet-agents.json   full provisioning record, mode 0600
 *   .dev.vars                      AGENTS_CONFIG_B64 for `wrangler dev`
 *
 * It never prints private keys. Do not commit .secrets/ or .dev.vars.
 *
 * Usage:
 *   node scripts/setup-testnet-agents.mjs            # create up to 3
 *   TARGET=1 node scripts/setup-testnet-agents.mjs   # create one for a smoke test
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Wallet } from "ethers";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { base58 } from "@scure/base";

ed.hashes.sha512 = sha512;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const secretsDir = path.join(root, ".secrets");
const secretsFile = path.join(secretsDir, "testnet-agents.json");
const devVarsFile = path.join(root, ".dev.vars");

const API = "https://testnet-api.orderly.org";
const FAUCET = "https://testnet-operator-evm.orderly.org/v1/faucet/usdc";
const BROKER = process.env.ORDERLY_BROKER_ID ?? "demo";
const CHAIN_ID = 421614;
const TARGET = Number(process.env.TARGET ?? 3);

const definitions = [
  {
    id: "btc-momentum",
    name: "Momentum",
    strategy: "momentum",
    symbol: "PERP_BTC_USDC",
    description: "EMA trend following with ATR stops on 5m BTC.",
  },
  {
    id: "btc-mean-reversion",
    name: "Mean Reversion",
    strategy: "mean-reversion",
    symbol: "PERP_BTC_USDC",
    description: "Bollinger band fade on 5m BTC with a trend filter.",
  },
  {
    id: "btc-breakout",
    name: "Breakout",
    strategy: "breakout",
    symbol: "PERP_BTC_USDC",
    description: "20-bar range breakout on 5m BTC with a trailing stop.",
  },
];

const domain = {
  name: "Orderly",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

const types = {
  Registration: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "timestamp", type: "uint64" },
    { name: "registrationNonce", type: "uint256" },
  ],
  AddOrderlyKey: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "orderlyKey", type: "string" },
    { name: "scope", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "expiration", type: "uint64" },
  ],
};

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }
  return payload;
}

function readExisting() {
  if (!existsSync(secretsFile)) return { accounts: [] };
  return JSON.parse(readFileSync(secretsFile, "utf8"));
}

function save(accounts) {
  mkdirSync(secretsDir, { recursive: true });
  const full = { broker: BROKER, chainId: CHAIN_ID, accounts };
  writeFileSync(secretsFile, `${JSON.stringify(full, null, 2)}\n`, { mode: 0o600 });
  chmodSync(secretsFile, 0o600);

  const workerConfig = {
    broker: BROKER,
    chainId: CHAIN_ID,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      strategy: account.strategy,
      symbol: account.symbol,
      description: account.description,
      address: account.address,
      accountId: account.accountId,
      publicKey: account.publicKey,
      apiSecretBase64: account.apiSecretBase64,
    })),
  };
  const encoded = Buffer.from(JSON.stringify(workerConfig), "utf8").toString("base64");
  const devVars = existsSync(devVarsFile) ? readFileSync(devVarsFile, "utf8") : "";
  const withoutAgent = devVars
    .split("\n")
    .filter((line) => !line.startsWith("AGENTS_CONFIG_B64=") && !line.startsWith("ORDERLY_NETWORK="))
    .join("\n")
    .trimEnd();
  writeFileSync(
    devVarsFile,
    `${withoutAgent}${withoutAgent ? "\n" : ""}ORDERLY_NETWORK=testnet\nAGENTS_CONFIG_B64=${encoded}\n`,
    { mode: 0o600 },
  );
  chmodSync(devVarsFile, 0o600);

  const workerDevVars = path.join(root, "worker/.dev.vars");
  mkdirSync(path.dirname(workerDevVars), { recursive: true });
  writeFileSync(workerDevVars, readFileSync(devVarsFile, "utf8"), { mode: 0o600 });
  chmodSync(workerDevVars, 0o600);

  console.log(`wrote ${path.relative(root, secretsFile)} and ${path.relative(root, devVarsFile)}`);
}

async function signRequest(apiSecretBase64, accountId, method, requestPath, body = "") {
  const seed = Buffer.from(apiSecretBase64, "base64");
  const publicKey = base58.encode(ed.getPublicKey(seed));
  const timestamp = Date.now();
  const message = `${timestamp}${method.toUpperCase()}${requestPath}${body}`;
  const signature = ed.sign(new TextEncoder().encode(message), seed);
  const signatureB64 = Buffer.from(signature)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return {
    "orderly-timestamp": String(timestamp),
    "orderly-account-id": accountId,
    "orderly-key": `ed25519:${publicKey}`,
    "orderly-signature": signatureB64,
  };
}

async function signedGet(account, requestPath) {
  const headers = await signRequest(
    account.apiSecretBase64,
    account.accountId,
    "GET",
    requestPath,
  );
  return jsonFetch(`${API}${requestPath}`, { method: "GET", headers });
}

async function createAccount(definition) {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const nonceResponse = await jsonFetch(`${API}/v1/registration_nonce`);
  const nonce = nonceResponse?.data?.registration_nonce;
  if (!nonce) throw new Error("no registration nonce");

  const timestamp = Date.now();
  const registerMessage = {
    brokerId: BROKER,
    chainId: CHAIN_ID,
    timestamp: String(timestamp),
    registrationNonce: String(nonce),
  };
  const registerSignature = await wallet.signTypedData(
    domain,
    { Registration: types.Registration },
    registerMessage,
  );
  const registered = await jsonFetch(`${API}/v1/register_account`, {
    method: "POST",
    body: JSON.stringify({
      message: registerMessage,
      signature: registerSignature,
      userAddress: address,
    }),
  });
  const accountId = registered?.data?.account_id;
  if (!accountId) throw new Error(`registration returned no account_id: ${JSON.stringify(registered)}`);

  const secret = ed.utils.randomSecretKey();
  const apiSecretBase64 = Buffer.from(secret).toString("base64");
  const publicKey = `ed25519:${base58.encode(ed.getPublicKey(secret))}`;
  const keyTimestamp = Date.now();
  const expiration = keyTimestamp + 365 * 24 * 60 * 60 * 1000;
  const keyMessage = {
    brokerId: BROKER,
    chainId: CHAIN_ID,
    orderlyKey: publicKey,
    scope: "read,trading",
    timestamp: String(keyTimestamp),
    expiration: String(expiration),
  };
  const keySignature = await wallet.signTypedData(
    domain,
    { AddOrderlyKey: types.AddOrderlyKey },
    keyMessage,
  );
  const keyed = await jsonFetch(`${API}/v1/orderly_key`, {
    method: "POST",
    body: JSON.stringify({
      message: keyMessage,
      signature: keySignature,
      userAddress: address,
    }),
  });
  if (keyed?.success !== true) throw new Error(`orderly_key failed: ${JSON.stringify(keyed)}`);

  const account = {
    ...definition,
    address,
    accountId,
    apiSecretBase64,
    publicKey,
    walletPrivateKey: wallet.privateKey,
    createdAt: new Date().toISOString(),
  };

  const check = await signedGet(account, "/v1/client/holding");
  if (check?.success !== true) throw new Error(`signed read failed: ${JSON.stringify(check)}`);

  return account;
}

async function faucet(account) {
  try {
    const result = await jsonFetch(FAUCET, {
      method: "POST",
      body: JSON.stringify({
        user_address: account.address,
        broker_id: BROKER,
        chain_id: String(CHAIN_ID),
      }),
    });
    console.log(`faucet ${account.id}: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`faucet ${account.id} failed: ${error.message}`);
  }
}

async function balanceOf(account) {
  const holding = await signedGet(account, "/v1/client/holding");
  const data = holding?.data ?? holding;
  const rows = data?.holding ?? [];
  const usdc = rows.find((row) => row.token === "USDC");
  return Number(usdc?.holding ?? 0);
}

const stored = readExisting();
const accounts = stored.accounts ?? [];

while (accounts.length < TARGET) {
  const definition = definitions[accounts.length];
  if (!definition) break;
  console.log(`creating ${definition.id} (${definition.name}) ...`);
  try {
    const account = await createAccount(definition);
    accounts.push(account);
    save(accounts);
    console.log(`created ${account.id} · ${account.address} · ${account.accountId}`);
  } catch (error) {
    console.error(`create ${definition.id} failed: ${error.message}`);
    break;
  }
}

if (!accounts.length) {
  console.error("no accounts provisioned");
  process.exit(1);
}

save(accounts);

// Fund any account with an empty USDC balance. Faucet delivery is asynchronous.
await Promise.all(
  accounts.slice(0, TARGET).map(async (account) => {
    try {
      const balance = await balanceOf(account);
      if (balance > 0) {
        console.log(`balance ${account.id}: ${balance} USDC`);
        return;
      }
      console.log(`balance ${account.id}: empty, requesting faucet`);
      await faucet(account);
    } catch (error) {
      console.error(`balance check ${account.id} failed: ${error.message}`);
    }
  }),
);

console.log(
  `\n${accounts.length}/${TARGET} accounts ready. Faucet delivery can take a few minutes.`,
);
console.log(`Worker secrets file: ${path.relative(root, devVarsFile)} (gitignored)`);
