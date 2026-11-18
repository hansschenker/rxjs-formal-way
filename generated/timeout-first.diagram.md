# timeout-first-relative-4-each-none-default: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Source" as s1
    state "Choosing" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S21-TIMEOUT-START subscribe [first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer]
    s1 --> s1 : S21-TIMEOUT-NEXT-CANCEL-TIMER source.next [a current timer is active; supplied time is a nondecreasing safe integer]
    s1 --> s1 : S21-TIMEOUT-NEXT-UNARMED source.next [first-only watchdog was already satisfied; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUT-SOURCE-COMPLETE source.complete [source completes before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUT-SOURCE-ERROR source.error [source fails before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUT-CANCEL-SOURCE cancel [consumer closes while source owns the connection; supplied time is a nondecreasing safe integer]
    s1 --> s2 : S21-TIMEOUT-EXPIRE timer.fire [current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer]
    s2 --> s3 : S21-TIMEOUT-FACTORY-THROW callback.throw [matching factory throws at invocation time; supplied time is a nondecreasing safe integer]
```
