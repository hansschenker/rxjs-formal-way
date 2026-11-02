# skipWhile-predicate: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SKIPWHILE-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source | testing with index zero | S5-SKIPWHILE-01 |
| SKIPWHILE-CALL | Testing | source.next | index < MAX_SAFE_INTEGER | invoke the predicate once with the input and its zero-based index | calling with retained input, invocation identity and advanced index | S5-SKIPWHILE-02 |
| SKIPWHILE-TRUE | Calling | callback.return | matching invocation and truthy result | no actions | testing with the already advanced index | S5-SKIPWHILE-03 |
| SKIPWHILE-FALSE | Calling | callback.return | matching invocation and falsy result | forward the first predicate-failing value | permanently open; predicate no longer called | S5-SKIPWHILE-03 |
| SKIPWHILE-OPEN-PASS | Open | source.next | gate has opened | forward the incoming value without invoking the predicate | still permanently open | S5-SKIPWHILE-04 |
| SKIPWHILE-THROW | Calling | callback.throw | matching pending invocation | forward the thrown value unchanged as an error; release the source | closed because the predicate threw | S5-SKIPWHILE-05 |
| SKIPWHILE-TESTING-COMPLETE | Testing | source.complete | no unresolved predicate invocation | complete downstream; release the source | closed because of complete | S5-SKIPWHILE-06 |
| SKIPWHILE-TESTING-ERROR | Testing | source.error | no unresolved predicate invocation | forward the source error unchanged; release the source | closed because of source-error | S5-SKIPWHILE-06 |
| SKIPWHILE-TESTING-CANCEL | Testing | cancel | no unresolved predicate invocation | release the source without notifying downstream | closed because of cancel | S5-SKIPWHILE-06 |
| SKIPWHILE-OPEN-COMPLETE | Open | source.complete | no unresolved predicate invocation | complete downstream; release the source | closed because of complete | S5-SKIPWHILE-06 |
| SKIPWHILE-OPEN-ERROR | Open | source.error | no unresolved predicate invocation | forward the source error unchanged; release the source | closed because of source-error | S5-SKIPWHILE-06 |
| SKIPWHILE-OPEN-CANCEL | Open | cancel | no unresolved predicate invocation | release the source without notifying downstream | closed because of cancel | S5-SKIPWHILE-06 |
