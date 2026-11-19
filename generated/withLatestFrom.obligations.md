# withLatestFrom-2-tuple: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session22-withLatestFrom-rxjs.test.mjs.

## S22-WITHLATESTFROM-START

Reach **Unsubscribed** with **no subscription exists**, then provide **subscribe**.

Expect, in order: subscribe to each auxiliary Observable in argument order; subscribe source last.

Resulting state: All readiness bits start false; no result is emitted until every auxiliary has a value.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-START.

## S22-WITHLATESTFROM-AUX-NEXT

Reach **Active** with **addressed auxiliary remains subscribed**, then provide **aux.next**.

Expect, in order: update latest auxiliary value and first-value presence bit, emit nothing.

Resulting state: Readiness changes only when all auxiliaries have emitted at least once.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-AUX-NEXT.

## S22-WITHLATESTFROM-AUX-COMPLETE

Reach **Active** with **addressed auxiliary remains subscribed**, then provide **aux.complete**.

Expect, in order: release completed auxiliary input only.

Resulting state: The last value/presence bit is retained; empty completion can permanently block readiness.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-AUX-COMPLETE.

## S22-WITHLATESTFROM-AUX-ERROR

Reach **Active** with **addressed auxiliary remains subscribed**, then provide **aux.error**.

Expect, in order: error downstream with identical payload; cancel source and other live auxiliaries.

Resulting state: Result terminates; no source value can recover auxiliary failure.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-AUX-ERROR.

## S22-WITHLATESTFROM-SOURCE-BLOCKED

Reach **Active** with **at least one auxiliary has not yet produced a value**, then provide **source.next**.

Expect, in order: drop the source value; do not enqueue it for later replay.

Resulting state: Latest ancillary values may still change but there is no source-triggered output.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-SOURCE-BLOCKED.

## S22-WITHLATESTFROM-SOURCE-READY

Reach **Active** with **every auxiliary has previously produced at least one value**, then provide **source.next**.

Expect, in order: emit a fresh tuple containing current source value and latest ancillary values.

Resulting state: Auxiliary memory remains unchanged until another auxiliary next.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-SOURCE-READY.

## S22-WITHLATESTFROM-SOURCE-COMPLETE

Reach **Active** with **source completes regardless of readiness**, then provide **source.complete**.

Expect, in order: complete downstream; release source and any remaining auxiliaries.

Resulting state: Closed without a final snapshot or synthetic tuple.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-SOURCE-COMPLETE.

## S22-WITHLATESTFROM-SOURCE-ERROR

Reach **Active** with **source fails**, then provide **source.error**.

Expect, in order: error downstream with same error; release source and live auxiliaries.

Resulting state: Closed without retries or output tuples.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-SOURCE-ERROR.

## S22-WITHLATESTFROM-CANCEL

Reach **Active** with **outer downstream closes its connection**, then provide **cancel**.

Expect, in order: release source and all live auxiliaries, emit nothing.

Resulting state: Closed; no retained latest values after teardown.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WITHLATESTFROM-CANCEL.
