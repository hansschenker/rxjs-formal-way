# distinct-direct-flush: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Selecting" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : DISTINCT-INIT subscribe [fresh result subscription]
    s1 --> s2 : DISTINCT-SELECT source.next [selector configured and index is valid]
    s1 --> s1 : DISTINCT-DIRECT-PASS source.next [no key selector and Set does not contain incoming value under SameValueZero]
    s1 --> s1 : DISTINCT-DIRECT-DROP source.next [no key selector and Set already contains incoming value under SameValueZero]
    s2 --> s1 : DISTINCT-KEY-PASS key.return [matching selection and previously unseen key under SameValueZero]
    s2 --> s1 : DISTINCT-KEY-DROP key.return [matching selection and previously seen key under SameValueZero]
    s2 --> s3 : DISTINCT-KEY-ERROR key.throw [matching selector invocation]
    s1 --> s1 : DISTINCT-FLUSH flush.next [notifier still active]
    s1 --> s1 : DISTINCT-FLUSH-COMPLETE flush.complete [notifier still active]
    s1 --> s3 : DISTINCT-FLUSH-ERROR flush.error [notifier still active]
    s1 --> s3 : DISTINCT-COMPLETE source.complete [no pending selector]
    s1 --> s3 : DISTINCT-ERROR source.error [no pending selector]
    s1 --> s3 : DISTINCT-CANCEL cancel [between completed source reactions]
```
