# endWith-unscheduled-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Suffix" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : ENDWITH-INIT subscribe [new subscription]
    s1 --> s1 : ENDWITH-PASS source.next [source live]
    s1 --> s2 : ENDWITH-SUFFIX-BEGIN source.complete [source successfully completed]
    s2 --> s2 : ENDWITH-SUFFIX-NEXT suffix.next [suffix index < number of values]
    s2 --> s3 : ENDWITH-SUFFIX-COMPLETE suffix.complete [all suffix values emitted]
    s1 --> s3 : ENDWITH-ERROR source.error [source fails]
    s1 --> s3 : ENDWITH-CANCEL-ACTIVE cancel [cancel during source]
    s2 --> s3 : ENDWITH-CANCEL-SUFFIX cancel [cancel between suffix emissions]
```
