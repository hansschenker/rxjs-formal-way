# timeInterval: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Pair each source value with the supplied-clock difference since connection or the preceding value.

**Scope:** One valid, synchronous external now provider. Finite numeric readings; finite differences for timeInterval. Provider readings may be negative, fractional, repeated or decreasing.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `timeInterval : Cω(SchedulerClock) → T* → {value:T,interval:number}*`. Each successful read produces one fresh wrapper around the unchanged source payload. Provider failure replaces the pending value with its exact error; source terminals and cancellation do not read time. Neither operator schedules work or delays notifications.

<!-- S21-TIMEINTERVAL-START-READ -->
The first interval starts at this connection, so a baseline reading is required before acquiring the source.

<!-- S21-TIMEINTERVAL-START-RETURN -->
A baseline does not itself produce a value; it belongs to this result subscription.

<!-- S21-TIMEINTERVAL-START-THROW -->
The operate setup catches a failed baseline reading before source.subscribe is reached.

<!-- S21-TIMEINTERVAL-NEXT-READ -->
No scheduler task is created. The read is part of the synchronous reaction to this value.

<!-- S21-TIMEINTERVAL-NEXT-RETURN -->
A decreasing provider produces a negative interval; no elapsed-time monotonicity is invented.

<!-- S21-TIMEINTERVAL-NEXT-THROW -->
The OperatorSubscriber catches a provider failure inside next and closes the existing source connection.

<!-- S21-TIMEINTERVAL-COMPLETE -->
Terminal notifications are forwarded without time decoration.

<!-- S21-TIMEINTERVAL-ERROR -->
A source error does not request the clock or wrap the error payload.

<!-- S21-TIMEINTERVAL-CANCEL -->
Closing a connection is neither a decorated value nor a terminal notification.

**Time:** Trace-envelope time is finite, nonnegative and nondecreasing. Provider readings are separate data and may move backwards. runClockTrace enforces same-envelope-time provider outcomes; no timer is introduced.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** Each provider.now request is an explicit invocation with no arguments. A correlated return or throw is supplied; the pure machine never calls a provider.

**Excluded:** Nonfinite provider readings and numeric-overflow differences. Clock-provider receiver/getter mutations, reentrant provider/observer actions, and consumer cancellation during a pending read. Source delivery during acquisition is characterized natively; action ordering here assumes setup has returned. TimeInterval class/prototype identity: the model exposes its value/interval structural projection; native tests separately inspect actual constructor identity. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-21-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-21.md) is reported separately from this specification.
