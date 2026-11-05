# bufferToggle-Observable-selector: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : BUFFERTOGGLE-INIT subscribe [fresh subscription]
    s2 --> s1 : BUFFERTOGGLE-CALLBACK-RETURN callback.return [matching selector generation]
    s2 --> s3 : BUFFERTOGGLE-CALLBACK-THROW callback.throw [matching selector generation]
    s1 --> s1 : BUFFERTOGGLE-SOURCE-NEXT source.next [source connected]
    s1 --> s3 : BUFFERTOGGLE-SOURCE-COMPLETE source.complete [source connected]
    s1 --> s3 : BUFFERTOGGLE-SOURCE-ERROR source.error [source connected]
    s1 --> s3 : BUFFERTOGGLE-CANCEL-ACTIVE cancel [active execution]
    s2 --> s3 : BUFFERTOGGLE-CANCEL-CALLING cancel [pending selector call, between microsteps]
    s1 --> s1 : BUFFERTOGGLE-CLOSING-NEXT closing.next [matching live closing generation]
    s1 --> s1 : BUFFERTOGGLE-CLOSING-COMPLETE closing.complete [matching live closing generation]
    s1 --> s3 : BUFFERTOGGLE-CLOSING-ERROR closing.error [matching live closing generation]
    s1 --> s2 : BUFFERTOGGLE-OPENINGS-NEXT openings.next [openings still subscribed, safe generation]
    s1 --> s1 : BUFFERTOGGLE-OPENINGS-COMPLETE openings.complete [openings still subscribed]
    s1 --> s3 : BUFFERTOGGLE-OPENINGS-ERROR openings.error [openings still subscribed]
```
