# elementAt-2-default: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| ELEMENTAT-INIT | Unsubscribed | subscribe | valid index | subscribe source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-INIT |
| ELEMENTAT-SKIP | Active | source.next | current index differs from requested index | advance index without emission | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-SKIP |
| ELEMENTAT-HIT | Active | source.next | current index equals requested index | emit same source value; complete; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-HIT |
| ELEMENTAT-MISSING-DEFAULT | Active | source.complete | index not reached and default supplied | emit fallback; complete; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-MISSING-DEFAULT |
| ELEMENTAT-MISSING-ERROR | Active | source.complete | index not reached and no default | report ArgumentOutOfRangeError; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-MISSING-ERROR |
| ELEMENTAT-SOURCE-ERROR | Active | source.error | source fails before indexed value | forward exact source error; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-SOURCE-ERROR |
| ELEMENTAT-CANCEL | Active | cancel | downstream closes early | release source silently | control and memory updated atomically; resource lifetime follows ordered actions | S11-ELEMENTAT-CANCEL |
