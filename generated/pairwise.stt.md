# pairwise-reference: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| PAIRWISE-INIT | Unsubscribed | subscribe | new execution | subscribe source; no previous value yet | active with no previous item | S4-PAIRWISE-INIT |
| PAIRWISE-FIRST | Active | source.next | no previous source value | remember the first source value without emitting | active remembering the first value | S4-PAIRWISE-FIRST |
| PAIRWISE-NEXT | Active | source.next | previous value remembered | store current value before emitting [previous, current] | active remembering the current value | S4-PAIRWISE-NEXT |
| PAIRWISE-COMPLETE | Active | source.complete | source finishes with any number of values | forward completion without flushing an incomplete pair; release source | closed after completion | S4-PAIRWISE-LIFECYCLE |
| PAIRWISE-ERROR | Active | source.error | source errors | forward the original error; release source | closed after error | S4-PAIRWISE-LIFECYCLE |
| PAIRWISE-CANCEL | Active | cancel | downstream unsubscribes | release source without completion | closed by cancellation | S4-PAIRWISE-LIFECYCLE |
