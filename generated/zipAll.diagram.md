# zipAll-deferred-fifo-8-8: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Collecting" as s1
    state "Joining" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S23-ZIPALL-START subscribe [fresh execution]
    s1 --> s1 : S23-ZIPALL-COLLECT outer.next [collected count is below maxInners]
    s1 --> s3 : S23-ZIPALL-OUTER-EMPTY outer.complete [no collected source occurrences]
    s1 --> s2 : S23-ZIPALL-OUTER-JOIN outer.complete [at least one collected source occurrence]
    s1 --> s3 : S23-ZIPALL-OUTER-ERROR outer.error [outer is live]
    s1 --> s3 : S23-ZIPALL-CANCEL-COLLECT cancel [outer connection is active]
    s2 --> s2 : S23-ZIPALL-INNER-BUFFER inner.next [live addressed inner, room in bounded scope, another FIFO empty]
    s2 --> s2 : S23-ZIPALL-INNER-EMIT inner.next [live addressed inner, all FIFOs ready after append, no completed FIFO exhausted]
    s2 --> s3 : S23-ZIPALL-INNER-DRAIN inner.next [all FIFOs ready after append; a completed FIFO has its final value]
    s2 --> s2 : S23-ZIPALL-INNER-COMPLETE-BUFFERED inner.complete [live addressed inner has queued values]
    s2 --> s3 : S23-ZIPALL-INNER-COMPLETE-EMPTY inner.complete [live addressed inner has no queued values]
    s2 --> s3 : S23-ZIPALL-INNER-ERROR inner.error [addressed inner is still live]
    s2 --> s3 : S23-ZIPALL-CANCEL-JOIN cancel [join owns live inputs]
```
