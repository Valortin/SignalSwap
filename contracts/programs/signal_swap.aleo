// signal_swap.aleo
// Port of TradeSignal.sol to Aleo - Privacy-preserving trade signals
// SPDX-License-Identifier: MIT

program signal_swap.aleo {

    // -------------------------------------------------------------------
    // Records (private user-owned signals)
    // Each submitted signal becomes a separate record owned by the trader
    // -------------------------------------------------------------------
    record TradeSignal {
        owner: address,
        symbol_hash: u128,          // hash of symbol string (off-chain can map back)
        action_hash: u128,          // hash("buy") or hash("sell")
        price: u128,
        timestamp: u128,
        signal_id: u128,            // unique per-user incremental id or hash
    }

    // -------------------------------------------------------------------
    // Public mappings (for discovery / stats)
    // -------------------------------------------------------------------
    // Last signal ID submitted by each trader (helps indexers know latest)
    mapping last_signal_id: address => u128;

    // Total number of signals ever submitted (global counter)
    mapping global_stats: u128 => u128;     // key 0 = total_signals

    // -------------------------------------------------------------------
    // Submit a new trade signal → creates a private record + updates public counters
    // -------------------------------------------------------------------
    transition submit_signal(
        public symbol_hash: u128,       // frontend computes poseidon_hash("BTCUSDT") etc.
        public action_hash: u128,       // poseidon_hash("buy") or poseidon_hash("sell")
        public price: u128
    ) -> TradeSignal {

        // Basic input validation (in transition - zk enforced)
        // Note: real checks for "non-zero" would be done off-chain or via constraints

        let caller: address = self.caller;

        // Get current last id for this user (0 if none)
        let current_id: u128 = Mapping::get_or_use(last_signal_id, caller, 0u128);
        let new_id: u128 = current_id + 1u128;

        // Create the private signal record
        let new_signal: TradeSignal = TradeSignal {
            owner: caller,
            symbol_hash: symbol_hash,
            action_hash: action_hash,
            price: price,
            timestamp: self.timestamp,      // block timestamp
            signal_id: new_id,
        };

        // Return the record (will be owned by caller)
        // Also return future for on-chain finalize
        new_signal
            finalize_update_counters(caller, new_id)
    }

    // -------------------------------------------------------------------
    // Finalize: update public state (visible on-chain)
    // -------------------------------------------------------------------
    finalize update_counters(
        caller: address,
        new_id: u128
    ) {
        // Update user's last signal id
        Mapping::set(last_signal_id, caller, new_id);

        // Increment global total signals
        let key_total: u128 = 0u128;
        let current_total: u128 = Mapping::get_or_use(global_stats, key_total, 0u128);
        Mapping::set(global_stats, key_total, current_total + 1u128);
    }

    // -------------------------------------------------------------------
    // View functions (public)
    // -------------------------------------------------------------------

    // Get total signals submitted globally
    transition get_total_signals() -> u128 {
        let key_total: u128 = 0u128;
        let total: u128 = Mapping::get_or_use(global_stats, key_total, 0u128);
        total
    }

    // Get last signal ID for a trader (to help frontend/indexer query records)
    transition get_last_signal_id(public trader: address) -> u128 {
        Mapping::get_or_use(last_signal_id, trader, 0u128)
    }
}