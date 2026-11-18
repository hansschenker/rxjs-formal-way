# timeout-first-absolute-5-each-none-factory: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session21-timeout-rxjs.test.mjs, tests/session21-timeout-differential.test.mjs.

## S21-TIMEOUT-START

Reach **Unsubscribed** with **first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer**, then provide **subscribe**.

Expect, in order: subscribe source; schedule initial watchdog.

Resulting state: Source with seen=0, lastValue=null and timer generation zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-START.

## S21-TIMEOUT-NEXT-CANCEL-TIMER

Reach **Source** with **a current timer is active; supplied time is a nondecreasing safe integer**, then provide **source.next**.

Expect, in order: cancel current timer before delivery; forward exact source value.

Resulting state: Seen advances and no watchdog remains after the first value.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-NEXT-CANCEL-TIMER.

## S21-TIMEOUT-NEXT-UNARMED

Reach **Source** with **first-only watchdog was already satisfied; supplied time is a nondecreasing safe integer**, then provide **source.next**.

Expect, in order: forward exact source value.

Resulting state: Seen advances and no watchdog remains after the first value.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-NEXT-UNARMED.

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

## S21-TIMEOUT-FACTORY-RETURN

Reach **Choosing** with **matching factory returns a valid Observable token at invocation time; supplied time is a nondecreasing safe integer**, then provide **callback.return**.

Expect, in order: subscribe returned fallback Observable.

Resulting state: Fallback with no timeout timer.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FACTORY-RETURN.

## S21-TIMEOUT-FACTORY-THROW

Reach **Choosing** with **matching factory throws at invocation time; supplied time is a nondecreasing safe integer**, then provide **callback.throw**.

Expect, in order: forward exact thrown error.

Resulting state: Closed error; original source and timer were already released.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FACTORY-THROW.

## S21-TIMEOUT-FALLBACK-NEXT

Reach **Fallback** with **notification belongs to the live fallback generation; supplied time is a nondecreasing safe integer**, then provide **fallback.next**.

Expect, in order: forward exact fallback value without scheduling.

Resulting state: Same fallback token; source stays disconnected.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FALLBACK-NEXT.

## S21-TIMEOUT-FALLBACK-COMPLETE

Reach **Fallback** with **notification belongs to live fallback; supplied time is a nondecreasing safe integer**, then provide **fallback.complete**.

Expect, in order: complete result; release fallback.

Resulting state: Closed complete; no source or timer exists.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FALLBACK-COMPLETE.

## S21-TIMEOUT-FALLBACK-ERROR

Reach **Fallback** with **notification belongs to live fallback; supplied time is a nondecreasing safe integer**, then provide **fallback.error**.

Expect, in order: forward exact fallback error; release fallback.

Resulting state: Closed error; no source or timer exists.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-FALLBACK-ERROR.

## S21-TIMEOUT-CANCEL-FALLBACK

Reach **Fallback** with **consumer closes the replacement connection; supplied time is a nondecreasing safe integer**, then provide **cancel**.

Expect, in order: release fallback silently.

Resulting state: Closed cancel; do not release original source twice.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-TIMEOUT-CANCEL-FALLBACK.
