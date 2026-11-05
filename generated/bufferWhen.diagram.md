# bufferWhen-Observable-selector: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s2 : BUFFERWHEN-INIT subscribe [fresh subscription]
    s2 --> s1 : BUFFERWHEN-CALLBACK-RETURN callback.return [matching selector generation]
    s2 --> s3 : BUFFERWHEN-CALLBACK-THROW callback.throw [matching selector generation]
    s1 --> s1 : BUFFERWHEN-SOURCE-NEXT source.next [source connected]
    s1 --> s3 : BUFFERWHEN-SOURCE-COMPLETE source.complete [source connected]
    s1 --> s3 : BUFFERWHEN-SOURCE-ERROR source.error [source connected]
    s1 --> s3 : BUFFERWHEN-CANCEL-ACTIVE cancel [active execution]
    s2 --> s3 : BUFFERWHEN-CANCEL-CALLING cancel [pending selector call, between microsteps]
    s1 --> s2 : BUFFERWHEN-CLOSING-NEXT closing.next [matching live closing generation]
    s1 --> s1 : BUFFERWHEN-CLOSING-COMPLETE closing.complete [matching live closing generation]
    s1 --> s3 : BUFFERWHEN-CLOSING-ERROR closing.error [matching live closing generation]
```
