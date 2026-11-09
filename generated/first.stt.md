# first-predicate-required: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FIRST-INIT | Unsubscribed | subscribe | fresh execution | subscribe source | updated control and memory | S12-FIRST-INIT |
| FIRST-DIRECT | Active | source.next | predicate omitted | emit first source value; complete; release source | terminal state with no owned live work | S12-FIRST-DIRECT |
| FIRST-CALL | Active | source.next | predicate supplied and index valid | invoke predicate | updated control and memory | S12-FIRST-CALL |
| FIRST-MATCH | Calling | callback.return | correlated truthy predicate result | emit original matched value; complete; release source | terminal state with no owned live work | S12-FIRST-MATCH |
| FIRST-MISS | Calling | callback.return | correlated falsy predicate result | advance predicate index silently | updated control and memory | S12-FIRST-MISS |
| FIRST-THROW | Calling | callback.throw | correlated predicate throw | error downstream; release source | terminal state with no owned live work | S12-FIRST-THROW |
| FIRST-EMPTY-DEFAULT | Active | source.complete | no admissible value and explicit default supplied | emit default; complete; release source | terminal state with no owned live work | S12-FIRST-EMPTY-DEFAULT |
| FIRST-EMPTY-ERROR | Active | source.complete | no admissible value and no default | error with EmptyError; release source | terminal state with no owned live work | S12-FIRST-EMPTY-ERROR |
| FIRST-SOURCE-ERROR | Active | source.error | source errors | forward exact error; release source | terminal state with no owned live work | S12-FIRST-SOURCE-ERROR |
| FIRST-CANCEL | Active | cancel | downstream closes | release source silently | terminal state with no owned live work | S12-FIRST-CANCEL |
