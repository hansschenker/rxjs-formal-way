# throttleTime-10-4: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-THROTTLETIME-START

Reach **Unsubscribed** with **first result connection; valid nondecreasing supplied time**, then provide **subscribe**.

Expect, in order: subscribe source; create no duration yet.

Resulting state: Open with empty pending memory and next duration generation zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-START.

## S20-THROTTLETIME-OPEN-NEXT

Reach **Open** with **no active duration; leading=true; valid nondecreasing supplied time**, then provide **source.next**.

Expect, in order: clear pending presence and emit the incoming value; schedule the next duration action.

Resulting state: Duration generation advances; pending memory is empty after leading output.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-OPEN-NEXT.

## S20-THROTTLETIME-REMEMBER

Reach **Throttled** with **a duration is active; valid nondecreasing supplied time**, then provide **source.next**.

Expect, in order: replace pending value without restarting duration or emitting.

Resulting state: Same duration generation/deadline; pending presence=true with newest payload.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-REMEMBER.

## S20-THROTTLETIME-END-OPEN

Reach **Throttled** with **current duration ends; trailing=false; valid nondecreasing supplied time**, then provide **timer.fire**.

Expect, in order: release current duration; emit nothing.

Resulting state: Open with no active duration; preserve any un-emitted internal memory until replaced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-END-OPEN.

## S20-THROTTLETIME-COMPLETE-OPEN

Reach **Open** with **source completes with no active duration; valid nondecreasing supplied time**, then provide **source.complete**.

Expect, in order: complete result without flushing retained value; release source.

Resulting state: Closed complete; all pending memory discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-COMPLETE-OPEN.

## S20-THROTTLETIME-COMPLETE-NOW

Reach **Throttled** with **trailing=false; valid nondecreasing supplied time**, then provide **source.complete**.

Expect, in order: complete result immediately; release source; release active duration.

Resulting state: Closed complete; no pending value is emitted.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-COMPLETE-NOW.

## S20-THROTTLETIME-SOURCE-ERROR-OPEN

Reach **Open** with **source fails; valid nondecreasing supplied time**, then provide **source.error**.

Expect, in order: forward exact source error; release source and any active duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-SOURCE-ERROR-OPEN.

## S20-THROTTLETIME-SOURCE-ERROR-THROTTLED

Reach **Throttled** with **source fails; valid nondecreasing supplied time**, then provide **source.error**.

Expect, in order: forward exact source error; release source and any active duration without flushing.

Resulting state: Closed error; pending value discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-SOURCE-ERROR-THROTTLED.

## S20-THROTTLETIME-CANCEL-OPEN

Reach **Open** with **consumer cancels this execution; valid nondecreasing supplied time**, then provide **cancel**.

Expect, in order: release only still-owned source/duration resources; emit nothing.

Resulting state: Closed cancel; clear all memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-CANCEL-OPEN.

## S20-THROTTLETIME-CANCEL-THROTTLED

Reach **Throttled** with **consumer cancels this execution; valid nondecreasing supplied time**, then provide **cancel**.

Expect, in order: release only still-owned source/duration resources; emit nothing.

Resulting state: Closed cancel; clear all memory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROTTLETIME-CANCEL-THROTTLED.
