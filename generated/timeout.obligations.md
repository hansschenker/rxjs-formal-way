# timeout-first-none-each-4-default: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session21-timeout-rxjs.test.mjs, tests/session21-timeout-differential.test.mjs.

## S21-TIMEOUT-START

Reach **Unsubscribed** with **first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer**, then provide **subscribe**.

Expect, in order: subscribe source; schedule initial watchdog.

Resulting state: Source with seen=0, lastValue=null and timer generation zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-START.

## S21-TIMEOUT-NEXT-CANCEL-TIMER

Reach **Source** with **a current timer is active; supplied time is a nondecreasing safe integer**, then provide **source.next**.

Expect, in order: cancel current timer before delivery; forward exact source value; schedule fresh each watchdog.

Resulting state: Seen advances, lastValue becomes input, and the fresh timer uses now+each.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-NEXT-CANCEL-TIMER.

## S21-TIMEOUT-SOURCE-COMPLETE

Reach **Source** with **source completes before watchdog delivery; supplied time is a nondecreasing safe integer**, then provide **source.complete**.

Expect, in order: complete result; release source; cancel any current timer.

Resulting state: Closed complete; no fallback acquisition.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-SOURCE-COMPLETE.

## S21-TIMEOUT-SOURCE-ERROR

Reach **Source** with **source fails before watchdog delivery; supplied time is a nondecreasing safe integer**, then provide **source.error**.

Expect, in order: forward exact source error; release source; cancel any current timer.

Resulting state: Closed error; no factory or fallback.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-SOURCE-ERROR.

## S21-TIMEOUT-CANCEL-SOURCE

Reach **Source** with **consumer closes while source owns the connection; supplied time is a nondecreasing safe integer**, then provide **cancel**.

Expect, in order: release source; cancel any current timer; emit nothing.

Resulting state: Closed cancel; no timeout factory or fallback.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-CANCEL-SOURCE.

## S21-TIMEOUT-EXPIRE

Reach **Source** with **current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer**, then provide **timer.fire**.

Expect, in order: release original source; cancel current timer during source finalization; invoke timeout factory with meta, seen and cleared lastValue.

Resulting state: Choosing awaits one same-time correlated factory outcome; no source/timer remains.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-EXPIRE.

## S21-TIMEOUT-FACTORY-THROW

Reach **Choosing** with **matching factory throws at invocation time; supplied time is a nondecreasing safe integer**, then provide **callback.throw**.

Expect, in order: forward exact thrown error.

Resulting state: Closed error; original source and timer were already released.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FACTORY-THROW.
