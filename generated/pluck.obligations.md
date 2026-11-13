# pluck-plain-data-path: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session16-rxjs.test.mjs.

## S16-PLUCK-INIT

Reach **Unsubscribed** with **first downstream connection**, then provide **subscribe**.

Expect, in order: subscribe one source.

Resulting state: Active with zero projected values.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PLUCK-INIT.

## S16-PLUCK-NEXT

Reach **Active** with **plain-data property path can be read**, then provide **source.next**.

Expect, in order: emit one nested property value, including undefined.

Resulting state: Active with source value count increased by one.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PLUCK-NEXT.

## S16-PLUCK-COMPLETE

Reach **Active** with **source completes**, then provide **source.complete**.

Expect, in order: forward completion and release source.

Resulting state: Closed complete; no source ownership.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PLUCK-COMPLETE.

## S16-PLUCK-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward exact error and release source.

Resulting state: Closed error; no source ownership.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PLUCK-ERROR.

## S16-PLUCK-CANCEL

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: release source without notifying downstream.

Resulting state: Closed cancelled; no source ownership.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PLUCK-CANCEL.
