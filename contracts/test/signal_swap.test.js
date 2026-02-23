// tests/signal_swap_test.leo
// Native Leo unit tests for signal_swap.aleo program
// Run with: leo test

import signal_swap.aleo;

@test
transition test_submit_signal_success() {
    // Hardcoded inputs (as required in Leo tests)
    let symbol_hash_input: u128 = 123456789u128;     // e.g., hash("BTCUSDT")
    let action_hash_input: u128 = 987654321u128;     // e.g., hash("buy")
    let price_input: u128 = 60000u128;

    // Call the transition (simulates execution)
    let signal_record: signal_swap.aleo/TradeSignal = signal_swap.aleo/submit_signal(
        symbol_hash_input,
        action_hash_input,
        price_input
    );

    // Assert outputs / side effects (in real Leo test, check returned record fields)
    assert_eq(signal_record.price, price_input);
    assert_eq(signal_record.signal_id, 1u128);       // first signal → id 1

    // Check public state after finalize (Leo test env exposes final state)
    let last_id: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_id, 1u128);

    let total_signals: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total_signals, 1u128);
}

@test
transition test_multiple_submissions_increments_id_and_total() {
    let symbol1: u128 = 111u128;
    let action1: u128 = 222u128;
    let price1: u128 = 50000u128;

    // First submission
    let _ = signal_swap.aleo/submit_signal(symbol1, action1, price1);

    let last_after_first: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_after_first, 1u128);

    let total_after_first: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total_after_first, 1u128);

    // Second submission (same caller)
    let symbol2: u128 = 333u128;
    let action2: u128 = 444u128;
    let price2: u128 = 70000u128;

    let _ = signal_swap.aleo/submit_signal(symbol2, action2, price2);

    let last_after_second: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_after_second, 2u128);

    let total_after_second: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total_after_second, 2u128);
}

@test
@should_fail
transition test_submit_with_zero_price_should_fail() {
    // Assuming we add a check in the program (recommended):
    // In submit_signal transition: assert(price > 0u128);

    let symbol: u128 = 555u128;
    let action: u128 = 666u128;
    let price_zero: u128 = 0u128;

    // This should fail assertion if check is added
    let _ = signal_swap.aleo/submit_signal(symbol, action, price_zero);
}

// Optional: Test invalid action/symbol if you add enum-like checks later