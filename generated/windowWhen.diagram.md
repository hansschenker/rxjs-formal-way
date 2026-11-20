# windowWhen-deferred-closing: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Selecting" as s1
    state "Active" as s2
    state "Stopped" as s3
    [*] --> s0
    s0 --> s1 : S22-WINDOWWHEN-START subscribe [no result connection exists]
    s1 --> s2 : S22-WINDOWWHEN-FACTORY-RETURN factory.return [outcome belongs to the current synchronous invocation]
    s1 --> s3 : S22-WINDOWWHEN-FACTORY-THROW factory.throw [throw belongs to the current synchronous invocation]
    s2 --> s2 : S22-WINDOWWHEN-SOURCE-NEXT source.next [source connection is live]
    s2 --> s1 : S22-WINDOWWHEN-CLOSING-NEXT closing.next [current closing generation; next window identity remains a safe integer]
    s2 --> s1 : S22-WINDOWWHEN-CLOSING-COMPLETE closing.complete [current closing generation; next window identity remains a safe integer]
    s2 --> s3 : S22-WINDOWWHEN-SOURCE-COMPLETE source.complete [source connection is live]
    s2 --> s3 : S22-WINDOWWHEN-SOURCE-ERROR source.error [live source, or matching current closing generation]
    s2 --> s3 : S22-WINDOWWHEN-CLOSING-ERROR closing.error [live source, or matching current closing generation]
    s2 --> s3 : S22-WINDOWWHEN-CANCEL cancel [outer connection closes between complete reactions]
    s2 --> s2 : S22-WINDOWWHEN-OBSERVE-OPEN-ACTIVE window.subscribe [fresh observer identity names a retained open window]
    s2 --> s2 : S22-WINDOWWHEN-OBSERVE-COMPLETE-ACTIVE window.subscribe [fresh observer identity names a retained complete window]
    s2 --> s2 : S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-ACTIVE window.unsubscribe [named observer owns a live child subscription]
    s3 --> s3 : S22-WINDOWWHEN-OBSERVE-OPEN-STOPPED window.subscribe [fresh observer identity names a retained open window]
    s3 --> s3 : S22-WINDOWWHEN-OBSERVE-COMPLETE-STOPPED window.subscribe [fresh observer identity names a retained complete window]
    s3 --> s3 : S22-WINDOWWHEN-OBSERVE-ERROR-STOPPED window.subscribe [fresh observer identity names a retained error window]
    s3 --> s3 : S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-STOPPED window.unsubscribe [named observer owns a live child subscription]
```
