# scan: accumulation profiles

Scan remembers an accumulation and emits each successfully processed update. Its two initialization policies have separate generated views, derived from [one canonical implementation](../src/models/scan.ts).

| Configuration | First source value | Generated behavior | BDD | STT | Four lanes |
|---|---|---|---|---|---|
| Seed supplied, including undefined | Call reducer(seed, value, 0) | [Seeded](scan-seeded.md) | [BDD](../generated/scan-seeded.bdd.md) | [STT](../generated/scan-seeded.stt.md) | [Trace](../generated/scan-seeded.trace.md) |
| No seed | Store and forward it, without calling reducer | [Unseeded](scan-unseeded.md) | [BDD](../generated/scan-unseeded.bdd.md) | [STT](../generated/scan-unseeded.stt.md) | [Trace](../generated/scan-unseeded.trace.md) |

The seed is not emitted at subscription. Empty input completes without a value. Completion does not append a final accumulation. Reducer throws and source errors terminate through the error channel; cancellation releases upstream without completing.

Time comes from the source and scheduler; scan creates no timer. No sharing or replay is introduced. Each subscription has separate bookkeeping, but a supplied seed object is not cloned.

Read [M02-B](../docs/M02-B-SCAN.md) for overloads, indices, ownership and limits, and [evidence](../evidence/M02-B.md) for verified execution status. This index is a reading guide; generated behavior is traced to rule IDs in the linked pages.
