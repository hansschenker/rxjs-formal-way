# every-indexed-predicate: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| EVERY-INIT | Unsubscribed | subscribe | fresh execution | subscribe source with index zero | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-INIT |
| EVERY-CALL | Active | source.next | source next at valid index | invoke predicate with original value and index | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-CALL |
| EVERY-TRUE | Calling | callback.return | correlated truthy predicate outcome | advance index, no output | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-TRUE |
| EVERY-FALSE | Calling | callback.return | correlated falsy predicate outcome | emit false once; complete; unsubscribe | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-FALSE |
| EVERY-THROW | Calling | callback.throw | correlated throwing predicate | forward exact thrown identity; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-THROW |
| EVERY-SOURCE-COMPLETE | Active | source.complete | no falsy predicate occurred | emit true once; complete; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-SOURCE-COMPLETE |
| EVERY-SOURCE-ERROR | Active | source.error | upstream errors | forward error without boolean; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-SOURCE-ERROR |
| EVERY-CANCEL | Active | cancel | explicit cancellation | release source silently | control and memory updated atomically; resource lifetime follows ordered actions | S11-EVERY-CANCEL |
