# withLatestFrom-2-tuple: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S22-WITHLATESTFROM-START subscribe [no subscription exists]
    s1 --> s1 : S22-WITHLATESTFROM-AUX-NEXT aux.next [addressed auxiliary remains subscribed]
    s1 --> s1 : S22-WITHLATESTFROM-AUX-COMPLETE aux.complete [addressed auxiliary remains subscribed]
    s1 --> s2 : S22-WITHLATESTFROM-AUX-ERROR aux.error [addressed auxiliary remains subscribed]
    s1 --> s1 : S22-WITHLATESTFROM-SOURCE-BLOCKED source.next [at least one auxiliary has not yet produced a value]
    s1 --> s1 : S22-WITHLATESTFROM-SOURCE-READY source.next [every auxiliary has previously produced at least one value]
    s1 --> s2 : S22-WITHLATESTFROM-SOURCE-COMPLETE source.complete [source completes regardless of readiness]
    s1 --> s2 : S22-WITHLATESTFROM-SOURCE-ERROR source.error [source fails]
    s1 --> s2 : S22-WITHLATESTFROM-CANCEL cancel [outer downstream closes its connection]
```
