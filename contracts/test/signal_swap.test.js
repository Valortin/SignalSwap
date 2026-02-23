import signal_swap.aleo;

@test
transition test_submit_signal_success() {
    let symbol_hash: u128 = 123456789u128;
    let action_hash: u128 = 987654321u128;
    let price: u128 = 60000u128;

    let signal: signal_swap.aleo/TradeSignal = signal_swap.aleo/submit_signal(
        symbol_hash,
        action_hash,
        price
    );

    assert_eq(signal.price, price);
    assert_eq(signal.signal_id, 1u128);

    let last_id: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_id, 1u128);

    let total: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total, 1u128);
}

@test
transition test_multiple_submissions_increments_id_and_total() {
    let symbol1: u128 = 111u128;
    let action1: u128 = 222u128;
    let price1: u128 = 50000u128;

    let _: signal_swap.aleo/TradeSignal =
        signal_swap.aleo/submit_signal(symbol1, action1, price1);

    let last_first: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_first, 1u128);

    let total_first: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total_first, 1u128);

    let symbol2: u128 = 333u128;
    let action2: u128 = 444u128;
    let price2: u128 = 70000u128;

    let _: signal_swap.aleo/TradeSignal =
        signal_swap.aleo/submit_signal(symbol2, action2, price2);

    let last_second: u128 = signal_swap.aleo/get_last_signal_id(self.caller);
    assert_eq(last_second, 2u128);

    let total_second: u128 = signal_swap.aleo/get_total_signals();
    assert_eq(total_second, 2u128);
}

@test
@should_fail
transition test_submit_with_zero_price_should_fail() {
    let symbol: u128 = 555u128;
    let action: u128 = 666u128;
    let zero_price: u128 = 0u128;

    let _: signal_swap.aleo/TradeSignal =
        signal_swap.aleo/submit_signal(symbol, action, zero_price);
}