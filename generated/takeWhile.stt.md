# takeWhile-predicate-inclusive: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| TAKEWHILE-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source | testing with index zero | S5-TAKEWHILE-01 |
| TAKEWHILE-CALL | Testing | source.next | index < MAX_SAFE_INTEGER | invoke the predicate once with the input and its zero-based index | calling with retained input, invocation identity and advanced index | S5-TAKEWHILE-02 |
| TAKEWHILE-TRUE | Calling | callback.return | matching invocation and truthy result | forward the original value | testing with the already advanced index | S5-TAKEWHILE-03 |
| TAKEWHILE-FALSE | Calling | callback.return | matching invocation and falsy result | forward the first predicate-failing value; complete downstream; release the source | closed because the predicate failed | S5-TAKEWHILE-03 |
| TAKEWHILE-THROW | Calling | callback.throw | matching pending invocation | forward the thrown value unchanged as an error; release the source | closed because the predicate threw | S5-TAKEWHILE-05 |
| TAKEWHILE-TESTING-COMPLETE | Testing | source.complete | no unresolved predicate invocation | complete downstream; release the source | closed because of complete | S5-TAKEWHILE-06 |
| TAKEWHILE-TESTING-ERROR | Testing | source.error | no unresolved predicate invocation | forward the source error unchanged; release the source | closed because of source-error | S5-TAKEWHILE-06 |
| TAKEWHILE-TESTING-CANCEL | Testing | cancel | no unresolved predicate invocation | release the source without notifying downstream | closed because of cancel | S5-TAKEWHILE-06 |
