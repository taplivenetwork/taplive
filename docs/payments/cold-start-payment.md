# Cold-Start Payment System (Public, Compliance Version)

## Principles
- **Instant pay, no custody**: Payments flow through licensed processors; the platform does not hold user balances.
- **No pre-paid credits**: No stored value, no top-ups, no internal wallet.
- **Compliance-first**: KYC/AML obligations are handled by payment partners where applicable.

## Flow (Public Overview)
1. Order is created and priced.
2. Payer completes checkout with a third-party processor.
3. Provider receives funds via the processor’s standard payout rails.
4. Platform records the transaction metadata for audit (no balance custody).

## Disclaimers
- Tap Credits are **not** a payment instrument.
- No tokens, NFTs, or assetization mechanisms.
- Refunds/chargebacks follow the processor’s policy and local laws.

_Status: public / Phase 1–2_
