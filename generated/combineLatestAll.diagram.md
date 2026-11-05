# combineLatestAll-deferred-latest-array: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Collecting" as s1
    state "Joining" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : COMBINELATESTALL-INIT subscribe [fresh subscription]
    s1 --> s1 : COMBINELATESTALL-OUTER-NEXT outer.next [outer still open; bounded count]
    s1 --> s3 : COMBINELATESTALL-OUTER-EMPTY outer.complete [no collected inner sources]
    s1 --> s2 : COMBINELATESTALL-OUTER-JOIN outer.complete [at least one collected inner source]
    s1 --> s3 : COMBINELATESTALL-OUTER-ERROR outer.error [outer still active]
    s2 --> s2 : COMBINELATESTALL-INNER-WAIT inner.next [live inner and at least one slot remains unready]
    s2 --> s2 : COMBINELATESTALL-INNER-EMIT inner.next [live inner and every other slot ready]
    s2 --> s2 : COMBINELATESTALL-INNER-COMPLETE-WAIT inner.complete [live inner and another still live]
    s2 --> s3 : COMBINELATESTALL-INNER-COMPLETE-LAST inner.complete [final live inner]
    s2 --> s3 : COMBINELATESTALL-INNER-ERROR inner.error [matching live inner]
    s1 --> s3 : COMBINELATESTALL-CANCEL-COLLECT cancel [outer live]
    s2 --> s3 : COMBINELATESTALL-CANCEL-JOIN cancel [join live]
```
