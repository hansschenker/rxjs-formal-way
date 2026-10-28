# map-project: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| MAP-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source without invoking the callback | active with callback index zero | M02-MAP-01 |
| MAP-CALL | Active | source.next | index < Number.MAX_SAFE_INTEGER | request exactly one callback invocation with the incoming value and the current zero-based index | calling with the input retained and the next index increased by one | M02-MAP-02 |
| MAP-RETURN | Calling | callback.return | outcome identifies the pending invocation | forward the returned result as one value | active with the next callback index | M02-MAP-03 |
| MAP-THROW | Calling | callback.throw | outcome identifies the pending invocation | forward the thrown error unchanged; release the source subscription | closed because the callback threw | M02-MAP-04 |
| MAP-COMPLETE | Active | source.complete | no unresolved callback | complete downstream; release the source subscription | closed because the source completed | M02-MAP-05 |
| MAP-ERROR | Active | source.error | no unresolved callback | forward the source error unchanged; release the source subscription | closed because the source errored | M02-MAP-06 |
| MAP-CANCEL | Active | cancel | between resolved value reactions | release the source subscription without notifying downstream | closed because downstream cancelled | M02-MAP-07 |
