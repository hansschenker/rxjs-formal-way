# catchError-one-Observable-replacement: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Source" as s1
    state "Calling" as s2
    state "Replacement" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : CATCHERROR-INIT subscribe [fresh execution]
    s1 --> s1 : CATCHERROR-SOURCE-NEXT source.next [original connected]
    s1 --> s2 : CATCHERROR-SOURCE-ERROR source.error [source connected]
    s2 --> s3 : CATCHERROR-SELECTOR-RETURN callback.return [matching callback resource]
    s2 --> s4 : CATCHERROR-SELECTOR-THROW callback.throw [matching selector (or synchronous throw without resource)]
    s1 --> s4 : CATCHERROR-SOURCE-COMPLETE source.complete [original connected]
    s3 --> s3 : CATCHERROR-REPLACEMENT-NEXT replacement.next [replacement connected]
    s3 --> s4 : CATCHERROR-REPLACEMENT-COMPLETE replacement.complete [replacement connected]
    s3 --> s4 : CATCHERROR-REPLACEMENT-ERROR replacement.error [replacement connected]
    s1 --> s4 : CATCHERROR-CANCEL-SOURCE cancel [active subscription]
    s2 --> s4 : CATCHERROR-CANCEL-CALLING cancel [active subscription]
    s3 --> s4 : CATCHERROR-CANCEL-REPLACEMENT cancel [active subscription]
```
