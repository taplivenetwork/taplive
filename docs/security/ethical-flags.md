# Ethical Flags & Labels (Public Overview)

## Levels (example)
- `INFO`: Neutral informational markers.
- `NOTICE`: Requires attention (e.g., sensitive location).
- `RESTRICTED`: Access requires additional checks.
- `BLOCKED`: Prohibited content/action.

## UI Embedding (public mock)
- Small flag icon near replay header.
- Tooltip with flag level and short reason.

## API (public surface)
- `risk_label`: string enum (`INFO|NOTICE|RESTRICTED|BLOCKED`)
- `updated_at`: ISO timestamp
- `reason_code`: short code (no internal weights)

> Internal scoring, thresholds, and detection heuristics remain private.
