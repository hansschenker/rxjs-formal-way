# debounce-Observable-duration: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : DEBOUNCE-INIT subscribe [fresh subscription]
    s1 --> s2 : DEBOUNCE-NEW-VALUE source.next [source live; pending duration may exist]
    s2 --> s1 : DEBOUNCE-DURATION-RETURN callback.return [matching pending selector invocation]
    s2 --> s3 : DEBOUNCE-DURATION-THROW callback.throw [matching selector invocation]
    s1 --> s1 : DEBOUNCE-DURATION-NEXT duration.next [matching live duration]
    s1 --> s1 : DEBOUNCE-DURATION-EMPTY duration.complete [matching live duration completed without next]
    s1 --> s3 : DEBOUNCE-DURATION-ERROR duration.error [matching live duration]
    s1 --> s3 : DEBOUNCE-SOURCE-COMPLETE source.complete [source completes]
    s1 --> s3 : DEBOUNCE-SOURCE-ERROR-ACTIVE source.error [source errors]
    s1 --> s3 : DEBOUNCE-CANCEL-ACTIVE cancel [downstream cancels]
    s2 --> s3 : DEBOUNCE-SOURCE-ERROR-CALLING source.error [source errors]
    s2 --> s3 : DEBOUNCE-CANCEL-CALLING cancel [downstream cancels]
```
