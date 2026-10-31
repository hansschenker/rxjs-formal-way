# shareReplay-2-6-0: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Disconnected" as s0
    state "Connected" as s1
    state "Completed" as s2
    [*] --> s0
    s0 --> s1 : SHAREREPLAY-CONNECT subscriber.subscribe [fresh subscription ID and available connection generation; environment clock must not move backwards]
    s1 --> s1 : SHAREREPLAY-JOIN subscriber.subscribe [fresh subscription ID; environment clock must not move backwards]
    s1 --> s1 : SHAREREPLAY-NEXT source.next [current source generation; environment clock must not move backwards]
    s1 --> s1 : SHAREREPLAY-LEAVE subscriber.unsubscribe [registered subscriber and at least one other remains; environment clock must not move backwards]
    s1 --> s1 : SHAREREPLAY-LAST-RETAIN subscriber.unsubscribe [the last registered subscriber leaves; resetOnRefCountZero=false; environment clock must not move backwards]
    s1 --> s2 : SHAREREPLAY-COMPLETE-RETAIN source.complete [current generation; resetOnComplete=false; environment clock must not move backwards]
    s2 --> s2 : SHAREREPLAY-LATE-COMPLETE subscriber.subscribe [fresh subscription ID; retained terminal Subject; environment clock must not move backwards]
    s1 --> s0 : SHAREREPLAY-ERROR-RESET source.error [current generation; resetOnError=true; environment clock must not move backwards]
```
