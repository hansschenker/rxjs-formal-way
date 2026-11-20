# zipWith-3-fifo-8: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S23-ZIPWITH-START subscribe [no connection yet]
    s1 --> s1 : S23-ZIPWITH-BUFFER input.next [addressed input live; within FIFO/count scope; another FIFO remains empty]
    s1 --> s1 : S23-ZIPWITH-EMIT input.next [addressed input live; every FIFO becomes nonempty; no completed FIFO is exhausted]
    s1 --> s2 : S23-ZIPWITH-EMIT-LAST input.next [addressed input live; tuple ready; removing it exhausts a previously completed FIFO]
    s1 --> s1 : S23-ZIPWITH-COMPLETE-BUFFERED input.complete [addressed input live and its FIFO is nonempty]
    s1 --> s2 : S23-ZIPWITH-COMPLETE-EMPTY input.complete [addressed input live and its FIFO is empty]
    s1 --> s2 : S23-ZIPWITH-ERROR input.error [addressed input live]
    s1 --> s2 : S23-ZIPWITH-CANCEL cancel [result connection remains active]
```
