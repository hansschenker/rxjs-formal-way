# timeoutWith-first-absolute-5-each-none-constant: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Source" as s1
    state "Fallback" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S21-TIMEOUTWITH-START subscribe [first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer]
    s1 --> s1 : S21-TIMEOUTWITH-NEXT-CANCEL-TIMER source.next [a current timer is active; supplied time is a nondecreasing safe integer]
    s1 --> s1 : S21-TIMEOUTWITH-NEXT-UNARMED source.next [first-only watchdog was already satisfied; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUTWITH-SOURCE-COMPLETE source.complete [source completes before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUTWITH-SOURCE-ERROR source.error [source fails before watchdog delivery; supplied time is a nondecreasing safe integer]
    s1 --> s3 : S21-TIMEOUTWITH-CANCEL-SOURCE cancel [consumer closes while source owns the connection; supplied time is a nondecreasing safe integer]
    s1 --> s2 : S21-TIMEOUTWITH-EXPIRE timer.fire [current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer]
    s2 --> s2 : S21-TIMEOUTWITH-FALLBACK-NEXT fallback.next [notification belongs to the live fallback generation; supplied time is a nondecreasing safe integer]
    s2 --> s3 : S21-TIMEOUTWITH-FALLBACK-COMPLETE fallback.complete [notification belongs to live fallback; supplied time is a nondecreasing safe integer]
    s2 --> s3 : S21-TIMEOUTWITH-FALLBACK-ERROR fallback.error [notification belongs to live fallback; supplied time is a nondecreasing safe integer]
    s2 --> s3 : S21-TIMEOUTWITH-CANCEL-FALLBACK cancel [consumer closes the replacement connection; supplied time is a nondecreasing safe integer]
```
