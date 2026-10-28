# scan-unseeded-accumulator: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SCAN-INIT-UNSEEDED | Unsubscribed | subscribe | fresh execution | subscribe to the source without emitting a value or invoking the reducer | empty with index zero | M02B-SCAN-01, M02B-SCAN-02, M02B-SCAN-03 |
| SCAN-FIRST | Empty | source.next | first source value; no seed supplied | emit the first source value without invoking the reducer | active with the first value as accumulation and source index one | M02B-SCAN-05, M02B-SCAN-06 |
| SCAN-CALL | Active | source.next | index < Number.MAX_SAFE_INTEGER | request one reducer call with the previous accumulation, incoming value and current source index | calling with prior accumulation and input retained; next index increased by one | M02B-SCAN-04, M02B-SCAN-05, M02B-SCAN-06 |
| SCAN-RETURN | Calling | callback.return | outcome identifies the pending invocation | emit the returned accumulation once | active with the returned accumulation and the already advanced index | M02B-SCAN-04, M02B-SCAN-05, M02B-SCAN-07, M02B-SCAN-08 |
| SCAN-THROW | Calling | callback.throw | outcome identifies the pending invocation | forward the thrown error unchanged; release the source subscription | closed because the reducer threw | M02B-SCAN-09 |
| SCAN-EMPTY-COMPLETE | Empty | source.complete | no pending reducer | complete downstream without another value; release the source subscription | closed because the source completed | M02B-SCAN-02, M02B-SCAN-10 |
| SCAN-EMPTY-ERROR | Empty | source.error | no pending reducer | forward the source error unchanged; release the source subscription | closed because the source errored | M02B-SCAN-11 |
| SCAN-EMPTY-CANCEL | Empty | cancel | between resolved value reactions | release the source subscription without notifying downstream | closed because downstream cancelled | M02B-SCAN-12 |
| SCAN-ACTIVE-COMPLETE | Active | source.complete | no pending reducer | complete downstream without another value; release the source subscription | closed because the source completed | M02B-SCAN-02, M02B-SCAN-10 |
| SCAN-ACTIVE-ERROR | Active | source.error | no pending reducer | forward the source error unchanged; release the source subscription | closed because the source errored | M02B-SCAN-11 |
| SCAN-ACTIVE-CANCEL | Active | cancel | between resolved value reactions | release the source subscription without notifying downstream | closed because downstream cancelled | M02B-SCAN-12 |
