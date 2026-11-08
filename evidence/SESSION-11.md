# Session 11 evidence — pending independent verification

**8 November 2026 · Europe/Zurich**. Exactly five queued distinct RxJS 7.8.2 operator export names reserved: **dematerialize, elementAt, endWith, every, exhaust**. The previous 50 accepted exports remain unchanged. The session reservation commit is **91d03c84ca94dd9d64833a59fa3ee6a0d0325501**.

Version-pinned source revision **e5351d02e225e275ac0e497c7b66eaa5f0c88791**. See [the technical guide](../docs/SESSION-11-NOTIFICATIONS-SELECTION-QUANTIFIERS.md) for behavioral dimensions, scoped Mealy six-tuples and source links. The four new pure models are in src/models/session11-scalar.ts; the exact alias reuses the previously reviewed exhaustAll model in src/models/exhaust.ts. They use schema 1.1 and existing rendering, runner and generator infrastructure.

**Provisional status:** not accepted until actual CI execution is retrieved. No runtime claims can be made from model-predicted traces. A successful read-only committed-file drift check is required after artifacts are published. The expected five examples add forty projections to the prior 432, subject to successful execution.

Scoped exclusions: reentrant observer/source delivery, malformed Notification objects, unsupported numeric elementAt indexes, deprecated scheduled endWith and every(thisArg), unbounded ObservableInput conversion, and throwing downstream observer/finalizer callbacks. Finite test coverage will not prove general semantic equivalence.

## Verification ledger

- Tested checkout: **pending**
- Syntax and strict TypeScript: **not yet verified**
- Pure model and native RxJS 7.8.2 tests: **not yet verified**
- Generation and drift validation: **not yet verified**
- Independent read-only committed-file check: **not yet executed**
- Accepted names: **none yet**
- Carryovers: **dematerialize, elementAt, endWith, every, exhaust** until acceptance
