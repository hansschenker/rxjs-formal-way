# Executable operator profiles

Each configured profile has one canonical TypeScript rule set and eight generated views. Read the plain-language page first; use the milestone guide for assumptions and verification.

| Operator | Canonical model | Readable page | Evidence |
|---|---|---|---|
| take | [take.ts](../src/models/take.ts) | [Behavior](take.md) | [M01](../evidence/M01.md) |
| map | [map.ts](../src/models/map.ts) | [Behavior](map.md) | [M02-A](../evidence/M02.md) |
| filter | [filter.ts](../src/models/filter.ts) | [Behavior](filter.md) | [M02-A](../evidence/M02.md) |
| scan, seeded and unseeded | [scan.ts](../src/models/scan.ts) | [Profile guide](scan.md) | [M02-B](../evidence/M02-B.md) |

Map/filter share their lifecycle specification in [value.ts](../src/models/value.ts), not their business functions. Callback functions are external to the pure models. [M02-A](../docs/M02-VALUE-SELECTION.md) explains the invocation/outcome boundary. [M02-B](../docs/M02-B-SCAN.md) reuses it with a typed accumulator/value product and two initialization policies.

Five configured profiles produce 40 views across four operators. These are scoped profiles, not a complete RxJS operator catalogue. The [roadmap](../docs/ROADMAP.md) identifies the remaining reference operators.
