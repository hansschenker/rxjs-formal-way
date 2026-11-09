# find-first-match: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FIND-INIT | Unsubscribed | subscribe | fresh execution | subscribe source with predicate index zero | updated control and memory | S12-FIND-INIT |
| FIND-CALL | Active | source.next | valid zero-based index | invoke predicate with original value/index | updated control and memory | S12-FIND-CALL |
| FIND-MATCH | Calling | callback.return | correlated truthy result | emit original matched value; complete; release source | terminal state with no owned live work | S12-FIND-MATCH |
| FIND-MISS | Calling | callback.return | correlated falsy result | advance predicate index silently | updated control and memory | S12-FIND-MISS |
| FIND-THROW | Calling | callback.throw | correlated predicate throw | error downstream; release source | terminal state with no owned live work | S12-FIND-THROW |
| FIND-NOT-FOUND | Active | source.complete | no value matched | emit undefined; complete; release source | terminal state with no owned live work | S12-FIND-NOT-FOUND |
| FIND-SOURCE-ERROR | Active | source.error | source errors | forward exact error; release source | terminal state with no owned live work | S12-FIND-SOURCE-ERROR |
| FIND-CANCEL | Active | cancel | downstream closes | release source silently | terminal state with no owned live work | S12-FIND-CANCEL |
