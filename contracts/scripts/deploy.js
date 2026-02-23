// scripts/deploy.js
// Deploys the signal_swap.aleo program to Aleo mainnet (or testnet) using Provable SDK
// Requires: npm install @provablehq/sdk

import {
  Account,
  AleoNetworkClient,
  NetworkRecordProvider,
  ProgramManager,
  AleoKeyProvider,
  initThreadPool,
} from "@provablehq/sdk";

// For mainnet - adjust endpoint if needed (check https://developer.aleo.org for latest RPC)
const MAINNET_RPC = "https://api.explorer.aleo.org/v1"; // Official explorer API (mainnet)

// For local dev or testnet, use e.g. "http://localhost:3030" or testnet RPC

// IMPORTANT: Load your private key from .env (never commit it!)
// Example: process.env.PRIVATE_KEY = "APrivateKey1..."
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not set in .env");
}

async function main() {
  // Initialize thread pool (required for zk computations)
  await initThreadPool();

  // Create account from private key
  const account = new Account({ privateKey: PRIVATE_KEY });
  console.log("Deploying with account:", account.address().to_string());

  // Setup providers
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  const networkClient = new AleoNetworkClient(MAINNET_RPC);
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // ProgramManager orchestrates deployment
  const programManager = new ProgramManager(
    MAINNET_RPC,
    keyProvider,
    recordProvider
  );
  programManager.setAccount(account);

  // Read the compiled program string (in production, compile first with Leo CLI)
  // For simplicity, we paste the full program source here.
  // In real workflows → use fs.readFileSync('programs/signal_swap.aleo', 'utf8')
  // or compile to .aleo format and load the built program.
  const programSource = `
program signal_swap.aleo {

    record TradeSignal {
        owner: address,
        symbol_hash: u128,
        action_hash: u128,
        price: u128,
        timestamp: u128,
        signal_id: u128,
    }

    mapping last_signal_id: address => u128;
    mapping global_stats: u128 => u128;

    transition submit_signal(
        public symbol_hash: u128,
        public action_hash: u128,
        public price: u128
    ) -> TradeSignal {
        let caller: address = self.caller;
        let current_id: u128 = Mapping::get_or_use(last_signal_id, caller, 0u128);
        let new_id: u128 = current_id + 1u128;

        let new_signal: TradeSignal = TradeSignal {
            owner: caller,
            symbol_hash: symbol_hash,
            action_hash: action_hash,
            price: price,
            timestamp: self.timestamp,
            signal_id: new_id,
        };

        new_signal
            finalize update_counters(caller, new_id)
    }

    finalize update_counters(caller: address, new_id: u128) {
        Mapping::set(last_signal_id, caller, new_id);
        let key_total: u128 = 0u128;
        let current_total: u128 = Mapping::get_or_use(global_stats, key_total, 0u128);
        Mapping::set(global_stats, key_total, current_total + 1u128);
    }

    transition get_total_signals() -> u128 {
        let key_total: u128 = 0u128;
        Mapping::get_or_use(global_stats, key_total, 0u128)
    }

    transition get_last_signal_id(public trader: address) -> u128 {
        Mapping::get_or_use(last_signal_id, trader, 0u128)
    }
}
  `.trim();

  // Deployment fee in microcredits (Aleo credits) - adjust based on program size/complexity
  // Typical range: 1_000_000 to 10_000_000 microcredits (0.001 to 0.01 ALEO)
  const feeMicro = 5_000_000n; // 0.005 ALEO - example; monitor network fees

  console.log("Deploying signal_swap.aleo program...");

  try {
    // Deploy the program (builds + broadcasts the deployment transaction)
    const transactionId = await programManager.deploy(
      programSource,
      feeMicro,
      false // private = false → deployment is public
    );

    console.log(`Deployment transaction sent! Transaction ID: ${transactionId}`);

    // Optional: Wait for confirmation (poll the network)
    console.log("Waiting for confirmation...");
    const transaction = await networkClient.getTransaction(transactionId);
    if (transaction) {
      console.log("Deployment confirmed!");
      console.log("Program ID / deployment details:", transaction);
    } else {
      console.log("Transaction not yet confirmed. Check explorer: https://explorer.aleo.org/transaction/" + transactionId);
    }
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});