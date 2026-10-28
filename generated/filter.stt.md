# filter-predicate: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FILTER-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source without invoking the callback | active with callback index zero | M02-FILTER-01 |
| FILTER-CALL | Active | source.next | index < Number.MAX_SAFE_INTEGER | request exactly one callback invocation with the incoming value and the current zero-based index | calling with the input retained and the next index increased by one | M02-FILTER-02 |
| FILTER-PASS | Calling | callback.return | matching invocation and truthy result | forward the original incoming value unchanged | active with the next callback index | M02-FILTER-03 |
| FILTER-DROP | Calling | callback.return | matching invocation and falsy result | no actions | active with the next callback index | M02-FILTER-03, M02-FILTER-02 |
| FILTER-THROW | Calling | callback.throw | outcome identifies the pending invocation | forward the thrown error unchanged; release the source subscription | closed because the callback threw | M02-FILTER-04 |
| FILTER-COMPLETE | Active | source.complete | no unresolved callback | complete downstream; release the source subscription | closed because the source completed | M02-FILTER-05 |
| FILTER-ERROR | Active | source.error | no unresolved callback | forward the source error unchanged; release the source subscription | closed because the source errored | M02-FILTER-06 |
| FILTER-CANCEL | Active | cancel | between resolved value reactions | release the source subscription without notifying downstream | closed because downstream cancelled | M02-FILTER-07 |
