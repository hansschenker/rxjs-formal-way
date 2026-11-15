# sequenceEqual-strict-FIFO-32: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Comparing" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S18-SEQUENCEEQUAL-START subscribe [first downstream subscription]
    s1 --> s1 : S18-SEQUENCEEQUAL-LEFT-QUEUE left.next [current side live, opposite FIFO empty and incomplete; buffer below cap]
    s1 --> s2 : S18-SEQUENCEEQUAL-LEFT-EXTRA left.next [opposite stream already completed and has no unmatched value]
    s1 --> s1 : S18-SEQUENCEEQUAL-LEFT-MATCH left.next [opposite FIFO nonempty and strict equality holds against its oldest value]
    s1 --> s2 : S18-SEQUENCEEQUAL-LEFT-DIFFER left.next [opposite FIFO nonempty and strict equality fails]
    s1 --> s1 : S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE left.complete [current side is live and the other side is not yet completed]
    s1 --> s2 : S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL left.complete [opposite stream already completed; unmatched buffers both empty]
    s1 --> s2 : S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN left.complete [opposite stream already completed; unmatched buffers not empty]
    s1 --> s2 : S18-SEQUENCEEQUAL-LEFT-ERROR left.error [current side is live]
    s1 --> s1 : S18-SEQUENCEEQUAL-RIGHT-QUEUE right.next [current side live, opposite FIFO empty and incomplete; buffer below cap]
    s1 --> s2 : S18-SEQUENCEEQUAL-RIGHT-EXTRA right.next [opposite stream already completed and has no unmatched value]
    s1 --> s1 : S18-SEQUENCEEQUAL-RIGHT-MATCH right.next [opposite FIFO nonempty and strict equality holds against its oldest value]
    s1 --> s2 : S18-SEQUENCEEQUAL-RIGHT-DIFFER right.next [opposite FIFO nonempty and strict equality fails]
    s1 --> s1 : S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE right.complete [current side is live and the other side is not yet completed]
    s1 --> s2 : S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL right.complete [opposite stream already completed; unmatched buffers both empty]
    s1 --> s2 : S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN right.complete [opposite stream already completed; unmatched buffers not empty]
    s1 --> s2 : S18-SEQUENCEEQUAL-RIGHT-ERROR right.error [current side is live]
    s1 --> s2 : S18-SEQUENCEEQUAL-CANCEL cancel [consumer cancels]
```
