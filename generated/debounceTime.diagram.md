# debounceTime-3: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Idle" as s1
    state "Pending" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : DEBOUNCE-INIT subscribe [fresh execution and valid clock]
    s1 --> s2 : DEBOUNCE-START source.next [valid clock/deadline and a fresh timer identity is available]
    s2 --> s2 : DEBOUNCE-REPLACE source.next [valid nondecreasing clock and representable deadline]
    s2 --> s2 : DEBOUNCE-REARM timer.fire [matching due invocation; now < latest deadline; fresh identity available]
    s2 --> s1 : DEBOUNCE-EMIT timer.fire [matching due invocation; now >= latest deadline]
    s1 --> s3 : DEBOUNCE-COMPLETE-IDLE source.complete [valid nondecreasing clock]
    s1 --> s3 : DEBOUNCE-ERROR-IDLE source.error [valid nondecreasing clock]
    s1 --> s3 : DEBOUNCE-CANCEL-IDLE cancel [valid nondecreasing clock]
    s2 --> s3 : DEBOUNCE-COMPLETE-PENDING source.complete [valid nondecreasing clock]
    s2 --> s3 : DEBOUNCE-ERROR-PENDING source.error [valid nondecreasing clock]
    s2 --> s3 : DEBOUNCE-CANCEL-PENDING cancel [valid nondecreasing clock]
```
