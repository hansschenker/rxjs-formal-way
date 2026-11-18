# throttle-01: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-THROTTLE-START

Reach **Unsubscribed** with **first result connection; valid nondecreasing supplied time**, then provide **subscribe**.

Expect, in order: subscribe source; create no duration yet.

Resulting state: Open with empty pending memory and next duration generation zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-START.

## S20-THROTTLE-OPEN-NEXT

Reach **Open** with **no active duration; leading=false; valid nondecreasing supplied time**, then provide **source.next**.

Expect, in order: remember incoming value without output; invoke duration selector with that value.

Resulting state: Duration generation advances; this value is pending for a possible trailing output.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-OPEN-NEXT.

## S20-THROTTLE-SELECTOR-RETURN

Reach **Selecting** with **current selector invocation returns a valid Observable token at the same time; valid nondecreasing supplied time**, then provide **callback.return**.

Expect, in order: subscribe returned duration Observable.

Resulting state: Throttled with the current generation, returned token and unchanged pending memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-SELECTOR-RETURN.

## S20-THROTTLE-SELECTOR-THROW

Reach **Selecting** with **current selector invocation throws at the same time; valid nondecreasing supplied time**, then provide **callback.throw**.

Expect, in order: forward exact selector error; release source.

Resulting state: Closed error; do not acquire a duration.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-SELECTOR-THROW.

## S20-THROTTLE-REMEMBER

Reach **Throttled** with **a duration is active; valid nondecreasing supplied time**, then provide **source.next**.

Expect, in order: replace pending value without restarting duration or emitting.

Resulting state: Same duration generation/deadline; pending presence=true with newest payload.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-REMEMBER.

## S20-THROTTLE-END-EMIT-RESTART

Reach **Throttled** with **current duration ends with a pending value and trailing=true; valid nondecreasing supplied time**, then provide **duration.next**.

Expect, in order: release current duration; clear pending presence and emit latest value; invoke selector for emitted trailing value.

Resulting state: Pending memory is empty; a new duration generation starts while source remains live.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-END-EMIT-RESTART.

## S20-THROTTLE-END-OPEN

Reach **Throttled** with **current duration ends without a pending value; valid nondecreasing supplied time**, then provide **duration.next**.

Expect, in order: release current duration; emit nothing.

Resulting state: Open with no active duration; preserve any un-emitted internal memory until replaced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-END-OPEN.

## S20-THROTTLE-DURATION-EMPTY

Reach **Throttled** with **current duration completes without a next; valid nondecreasing supplied time**, then provide **duration.complete**.

Expect, in order: release completed duration; do not flush pending value.

Resulting state: Open; the pending reference is retained internally, not emitted.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-DURATION-EMPTY.

## S20-THROTTLE-COMPLETE-OPEN

Reach **Open** with **source completes with no active duration; valid nondecreasing supplied time**, then provide **source.complete**.

Expect, in order: complete result without flushing retained value; release source.

Resulting state: Closed complete; all pending memory discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-COMPLETE-OPEN.

## S20-THROTTLE-COMPLETE-WAIT

Reach **Throttled** with **trailing=true and a value is pending behind a live duration; valid nondecreasing supplied time**, then provide **source.complete**.

Expect, in order: release completed source; keep duration live.

Resulting state: Waiting with source closed, one duration owned and latest value retained.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-COMPLETE-WAIT.

## S20-THROTTLE-WAIT-END

Reach **Waiting** with **current duration ends after source completion; valid nondecreasing supplied time**, then provide **duration.next**.

Expect, in order: release current duration; emit the retained trailing value; complete result; do not start another duration.

Resulting state: Closed complete; source was already released, duration and memory are now gone.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-WAIT-END.

## S20-THROTTLE-WAIT-EMPTY

Reach **Waiting** with **current duration completes without next after source completion; valid nondecreasing supplied time**, then provide **duration.complete**.

Expect, in order: complete result without trailing output; release completed duration.

Resulting state: Closed complete; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-WAIT-EMPTY.

## S20-THROTTLE-COMPLETE-NOW

Reach **Throttled** with **there is no pending value; valid nondecreasing supplied time**, then provide **source.complete**.

Expect, in order: complete result immediately; release source; release active duration.

Resulting state: Closed complete; no pending value is emitted.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-COMPLETE-NOW.

## S20-THROTTLE-SOURCE-ERROR-OPEN

Reach **Open** with **source fails; valid nondecreasing supplied time**, then provide **source.error**.

Expect, in order: forward exact source error; release source and any active duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-SOURCE-ERROR-OPEN.

## S20-THROTTLE-SOURCE-ERROR-THROTTLED

Reach **Throttled** with **source fails; valid nondecreasing supplied time**, then provide **source.error**.

Expect, in order: forward exact source error; release source and any active duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-SOURCE-ERROR-THROTTLED.

## S20-THROTTLE-CANCEL-OPEN

Reach **Open** with **consumer cancels this execution; valid nondecreasing supplied time**, then provide **cancel**.

Expect, in order: release only still-owned source/duration resources; emit nothing.

Resulting state: Closed cancel; clear all memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-CANCEL-OPEN.

## S20-THROTTLE-CANCEL-THROTTLED

Reach **Throttled** with **consumer cancels this execution; valid nondecreasing supplied time**, then provide **cancel**.

Expect, in order: release only still-owned source/duration resources; emit nothing.

Resulting state: Closed cancel; clear all memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-CANCEL-THROTTLED.

## S20-THROTTLE-CANCEL-WAITING

Reach **Waiting** with **consumer cancels this execution; valid nondecreasing supplied time**, then provide **cancel**.

Expect, in order: release only still-owned source/duration resources; emit nothing.

Resulting state: Closed cancel; clear all memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-CANCEL-WAITING.

## S20-THROTTLE-DURATION-ERROR-THROTTLED

Reach **Throttled** with **currently owned duration fails; valid nondecreasing supplied time**, then provide **duration.error**.

Expect, in order: forward exact duration error; release still-live source and duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-DURATION-ERROR-THROTTLED.

## S20-THROTTLE-DURATION-ERROR-WAITING

Reach **Waiting** with **currently owned duration fails; valid nondecreasing supplied time**, then provide **duration.error**.

Expect, in order: forward exact duration error; release still-live source and duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLE-DURATION-ERROR-WAITING.
