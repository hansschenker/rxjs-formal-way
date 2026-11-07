# delay-fixed-timer-3: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : DELAY-INIT subscribe [fresh subscription]
    s1 --> s1 : DELAY-SOURCE-NEXT source.next [source live; timer mode]
    s1 --> s1 : DELAY-SOURCE-SELECT source.next [source live; selector mode]
    s1 --> s1 : DELAY-SELECTOR-RETURN callback.return [matching pending callback]
    s1 --> s2 : DELAY-SELECTOR-THROW callback.throw [matching pending callback]
    s1 --> s1 : DELAY-TIMER-FIRE timer.fire [current timer at/after deadline; source remains live or peers pending]
    s1 --> s2 : DELAY-TIMER-FINAL timer.fire [last timer at/after deadline and source already complete]
    s1 --> s1 : DELAY-DURATION-NEXT-Active duration.next [matching selected duration; closed only after outer finished and last item]
    s1 --> s2 : DELAY-DURATION-NEXT-Closed duration.next [matching selected duration; closed only after outer finished and last item]
    s1 --> s1 : DELAY-DURATION-EMPTY-Active duration.complete [matching selected duration; closed only after outer finished and last item]
    s1 --> s2 : DELAY-DURATION-EMPTY-Closed duration.complete [matching selected duration; closed only after outer finished and last item]
    s1 --> s2 : DELAY-DURATION-ERROR duration.error [matching selected duration]
    s1 --> s1 : DELAY-SOURCE-COMPLETE-WAIT source.complete [some pending duration remains]
    s1 --> s2 : DELAY-SOURCE-COMPLETE-EMPTY source.complete [no pending durations]
    s1 --> s2 : DELAY-SOURCE-ERROR source.error [source live]
    s1 --> s2 : DELAY-CANCEL cancel [downstream unsubscribed]
```
