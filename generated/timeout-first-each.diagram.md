# timeout-first-relative-6-each-3-factory: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Source" as s1
    state "Choosing" as s2
    state "Fallback" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : S21-TIMEOUT-START subscribe [first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer]
    s1 --> s1 : S21-TIMEOUT-NEXT-CANCEL-TIMER source.next [a current timer is active; supplied time is a nondecreasing safe integer]
    s1 --> s4 : S21-TIMEOUT-SOURCE-COMPLETE source.complete [source completes before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s4 : S21-TIMEOUT-SOURCE-ERROR source.error [source fails before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s4 : S21-TIMEOUT-CANCEL-SOURCE cancel [consumer closes while source owns the connection; supplied time is a nondecreasing safe integer]
    s1 --> s2 : S21-TIMEOUT-EXPIRE timer.fire [current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer]
    s2 --> s3 : S21-TIMEOUT-FACTORY-RETURN callback.return [matching factory returns a valid Observable token at invocation time; supplied time is a nondecreasing safe integer]
    s2 --> s4 : S21-TIMEOUT-FACTORY-THROW callback.throw [matching factory throws at invocation time; supplied time is a nondecreasing safe integer]
    s3 --> s3 : S21-TIMEOUT-FALLBACK-NEXT fallback.next [notification belongs to the live fallback generation; supplied time is a nondecreasing safe integer]
    s3 --> s4 : S21-TIMEOUT-FALLBACK-COMPLETE fallback.complete [notification belongs to live fallback; supplied time is a nondecreasing safe integer]
    s3 --> s4 : S21-TIMEOUT-FALLBACK-ERROR fallback.error [notification belongs to live fallback; supplied time is a nondecreasing safe integer]
    s3 --> s4 : S21-TIMEOUT-CANCEL-FALLBACK cancel [consumer closes the replacement connection; supplied time is a nondecreasing safe integer]
```
