# windowToggle-signals: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Selecting" as s2
    state "Stopped" as s3
    [*] --> s0
    s0 --> s1 : S22-WINDOWTOGGLE-START subscribe [first result connection]
    s1 --> s2 : S22-WINDOWTOGGLE-OPEN opening.next [opening signal is live and next identity can advance safely]
    s2 --> s1 : S22-WINDOWTOGGLE-SELECTOR-RETURN selector.return [matching synchronous selector returns a valid Observable]
    s2 --> s3 : S22-WINDOWTOGGLE-SELECTOR-THROW selector.throw [matching synchronous selector throws]
    s1 --> s1 : S22-WINDOWTOGGLE-SOURCE-NEXT source.next [source is connected between atomic reactions]
    s1 --> s1 : S22-WINDOWTOGGLE-CLOSING-NEXT closing.next [addressed closing subscription is live]
    s1 --> s1 : S22-WINDOWTOGGLE-CLOSING-COMPLETE closing.complete [addressed closing subscription is live]
    s1 --> s1 : S22-WINDOWTOGGLE-OPENING-COMPLETE opening.complete [opening subscription is live]
    s1 --> s3 : S22-WINDOWTOGGLE-SOURCE-ERROR source.error [source is connected]
    s1 --> s3 : S22-WINDOWTOGGLE-CLOSING-ERROR closing.error [addressed closing subscription is live]
    s1 --> s3 : S22-WINDOWTOGGLE-SOURCE-COMPLETE source.complete [source is connected]
    s1 --> s3 : S22-WINDOWTOGGLE-OPENING-ERROR opening.error [opening subscription is live]
    s1 --> s3 : S22-WINDOWTOGGLE-CANCEL cancel [outer consumer cancels between reactions]
    s1 --> s1 : S22-WINDOWTOGGLE-OBSERVE-OPEN window.subscribe [fresh observer names an announced open window]
    s1 --> s1 : S22-WINDOWTOGGLE-OBSERVE-COMPLETE-ACTIVE window.subscribe [fresh observer names an announced complete window]
    s1 --> s1 : S22-WINDOWTOGGLE-OBSERVER-CLOSE-ACTIVE window.unsubscribe [addressed child observer still owns a subscription]
    s3 --> s3 : S22-WINDOWTOGGLE-OBSERVE-COMPLETE-STOPPED window.subscribe [fresh observer names an announced complete window]
    s3 --> s3 : S22-WINDOWTOGGLE-OBSERVE-ERROR-STOPPED window.subscribe [fresh observer names an announced error window]
    s3 --> s3 : S22-WINDOWTOGGLE-OBSERVER-CLOSE-STOPPED window.unsubscribe [addressed child observer still owns a subscription]
```
