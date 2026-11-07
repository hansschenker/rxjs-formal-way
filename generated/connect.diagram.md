# connect-default-Subject-merge-two: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Preparing" as s1
    state "Active" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : CONNECT-INIT subscribe [fresh subscriber]
    s1 --> s2 : CONNECT-SELECTOR-READY selector.return [matching selected Observable]
    s1 --> s3 : CONNECT-SELECTOR-THROW selector.throw [selector threw before source subscription]
    s2 --> s2 : CONNECT-BROADCAST source.next [source subscribed through Subject]
    s2 --> s3 : CONNECT-COMPLETE source.complete [source completes]
    s2 --> s3 : CONNECT-ERROR source.error [source errors]
    s2 --> s3 : CONNECT-CANCEL cancel [downstream cancels]
```
