# timestamp: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Pair each source value with the provider reading taken during that value reaction.

**Scope:** One valid, synchronous external now provider. Finite numeric readings; finite differences for timeInterval. Provider readings may be negative, fractional, repeated or decreasing.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `timestamp : Cω(TimestampProvider) → T* → {value:T,timestamp:number}*`. Each successful read produces one fresh wrapper around the unchanged source payload. Provider failure replaces the pending value with its exact error; source terminals and cancellation do not read time. Neither operator schedules work or delays notifications.

<!-- S21-TIMESTAMP-START -->
timestamp reads only when a source value arrives; construction and connection do not request a timestamp.

<!-- S21-TIMESTAMP-NEXT-READ -->
No scheduler task is created. The read is part of the synchronous reaction to this value.

<!-- S21-TIMESTAMP-NEXT-RETURN -->
The provider reading is copied as supplied, independently of the trace-envelope time.

<!-- S21-TIMESTAMP-NEXT-THROW -->
The OperatorSubscriber catches a provider failure inside next and closes the existing source connection.

<!-- S21-TIMESTAMP-COMPLETE -->
Terminal notifications are forwarded without time decoration.

<!-- S21-TIMESTAMP-ERROR -->
A source error does not request the clock or wrap the error payload.

<!-- S21-TIMESTAMP-CANCEL -->
Closing a connection is neither a decorated value nor a terminal notification.

**Time:** Trace-envelope time is finite, nonnegative and nondecreasing. Provider readings are separate data and may move backwards. runClockTrace enforces same-envelope-time provider outcomes; no timer is introduced.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** Each provider.now request is an explicit invocation with no arguments. A correlated return or throw is supplied; the pure machine never calls a provider.

**Excluded:** Nonfinite provider readings and numeric-overflow differences. Clock-provider receiver/getter mutations, reentrant provider/observer actions, and consumer cancellation during a pending read. Source delivery during acquisition is characterized natively; action ordering here assumes setup has returned. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-21-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-21.md) is reported separately from this specification.
