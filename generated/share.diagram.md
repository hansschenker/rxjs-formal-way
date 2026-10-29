# share-111: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Disconnected" as s0
    state "Connected" as s1
    [*] --> s0
    s0 --> s1 : SHARE-CONNECT subscriber.subscribe [fresh subscription ID and available connection generation]
    s1 --> s1 : SHARE-JOIN subscriber.subscribe [fresh subscription ID]
    s1 --> s1 : SHARE-NEXT source.next [current source generation]
    s1 --> s1 : SHARE-LEAVE subscriber.unsubscribe [registered subscriber and at least one other remains]
    s1 --> s0 : SHARE-LAST-RESET subscriber.unsubscribe [the last registered subscriber leaves; resetOnRefCountZero=true]
    s1 --> s0 : SHARE-COMPLETE-RESET source.complete [current generation; resetOnComplete=true]
    s1 --> s0 : SHARE-ERROR-RESET source.error [current generation; resetOnError=true]
```
