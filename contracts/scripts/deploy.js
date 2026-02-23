import {
  Account,
  AleoNetworkClient,
  NetworkRecordProvider,
  ProgramManager,
  AleoKeyProvider,
  initThreadPool,
} from "@provablehq/sdk";

const MAINNET_RPC = "https://api.explorer.aleo.org/v1";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not set in environment");
}

async function main() {
  await initThreadPool();

  const account = new Account({ privateKey: PRIVATE_KEY });
  console.log("Deploying with account:", account.address().to_string());

  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  const networkClient = new AleoNetworkClient(MAINNET_RPC);
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  const programManager = new ProgramManager(
    MAINNET_RPC,
    keyProvider,
    recordProvider
  );

  programManager.setAccount(account);

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

        let signal: TradeSignal = TradeSignal {
            owner: caller,
            symbol_hash: symbol_hash,
            action_hash: action_hash,
            price: price,
            timestamp: self.timestamp,
            signal_id: new_id,
        };

        signal
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

  const feeMicro = 5_000_000n;

  console.log("Deploying signal_swap.aleo...");

  try {
    const txId = await programManager.deploy(
      programSource,
      feeMicro,
      false
    );

    console.log("Deployment transaction sent:", txId);
    console.log("Waiting for confirmation...");

    const tx = await networkClient.getTransaction(txId);

    if (tx) {
      console.log("Deployment confirmed");
      console.log("Transaction details:", tx);
    } else {
      console.log(
        "Not yet confirmed. Check explorer:",
        `https://explorer.aleo.org/transaction/${txId}`
      );
    }
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});