# findIndex-first-match: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FINDINDEX-INIT | Unsubscribed | subscribe | fresh execution | subscribe source with index zero | updated control and memory | S12-FINDINDEX-INIT |
| FINDINDEX-CALL | Active | source.next | valid zero-based index | invoke predicate | updated control and memory | S12-FINDINDEX-CALL |
| FINDINDEX-MATCH | Calling | callback.return | correlated truthy result | emit current index; complete; release source | terminal state with no owned live work | S12-FINDINDEX-MATCH |
| FINDINDEX-MISS | Calling | callback.return | correlated falsy result | advance index silently | updated control and memory | S12-FINDINDEX-MISS |
| FINDINDEX-THROW | Calling | callback.throw | correlated predicate throw | error downstream; release source | terminal state with no owned live work | S12-FINDINDEX-THROW |
| FINDINDEX-NOT-FOUND | Active | source.complete | no value matched | emit -1; complete; release source | terminal state with no owned live work | S12-FINDINDEX-NOT-FOUND |
| FINDINDEX-SOURCE-ERROR | Active | source.error | source errors | forward exact error; release source | terminal state with no owned live work | S12-FINDINDEX-SOURCE-ERROR |
| FINDINDEX-CANCEL | Active | cancel | downstream closes | release source silently | terminal state with no owned live work | S12-FINDINDEX-CANCEL |
