# Executable operator profiles

Each configured profile has one canonical TypeScript rule set and eight generated views. Read the plain-language page first; use the milestone guide for assumptions and verification.

| Operator | Canonical model | Readable page | Evidence |
|---|---|---|---|
| take | [take.ts](../src/models/take.ts) | [Behavior](take.md) | [M01](../evidence/M01.md) |
| map | [map.ts](../src/models/map.ts) | [Behavior](map.md) | [M02-A](../evidence/M02.md) |
| filter | [filter.ts](../src/models/filter.ts) | [Behavior](filter.md) | [M02-A](../evidence/M02.md) |
| scan, seeded and unseeded | [scan.ts](../src/models/scan.ts) | [Profile guide](scan.md) | [M02-B](../evidence/M02-B.md) |
| debounceTime | [debounceTime.ts](../src/models/debounceTime.ts) | [Behavior](debounceTime.md) | [M02-C](../evidence/M02-C.md) |

Map/filter share their lifecycle specification in [value.ts](../src/models/value.ts), not their business functions. Callback functions are external to the pure models. [M02-A](../docs/M02-VALUE-SELECTION.md) explains the invocation/outcome boundary. [M02-B](../docs/M02-B-SCAN.md) reuses it with a typed accumulator/value product and two initialization policies. [M02-C](../docs/M02-C-DEBOUNCE-TIME.md) adds explicit clock readings, timer invocations and deadline checks without introducing a clock inside the model.

Six configured profiles produce 48 views across five operators. These are scoped profiles, not a complete RxJS operator catalogue. The [roadmap](../docs/ROADMAP.md) identifies the remaining reference operators.
