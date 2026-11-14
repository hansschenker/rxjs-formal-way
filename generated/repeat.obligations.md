# repeat-bounded-restart-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session17-rxjs.test.mjs.

## S17-REPEAT-START

Reach **Unsubscribed** with **first downstream subscription**, then provide **subscribe**.

Expect, in order: subscribe source generation 0.

Resulting state: Active with attempt=1 and failure counter=0.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-START.

## S17-REPEAT-NEXT

Reach **Active** with **matching live source generation**, then provide **source.next**.

Expect, in order: forward value unchanged.

Resulting state: Remain Active with the current generation and updated failure counter.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-NEXT.

## S17-REPEAT-RESTART

Reach **Active** with **matching source and attempts<count**, then provide **source.complete**.

Expect, in order: release completed source; subscribe a new source generation.

Resulting state: New generation active with attempts incremented; old source disposed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-RESTART.

## S17-REPEAT-FINAL-COMPLETE

Reach **Active** with **matching source and attempts=count**, then provide **source.complete**.

Expect, in order: complete result; release final source.

Resulting state: Closed complete after the specified number of source executions.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-FINAL-COMPLETE.

## S17-REPEAT-ERROR

Reach **Active** with **any matching source error**, then provide **source.error**.

Expect, in order: forward exact error and release source.

Resulting state: Closed in error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-ERROR.

## S17-REPEAT-CANCEL

Reach **Active** with **downstream cancels active subscription**, then provide **cancel**.

Expect, in order: release current source without an output notification.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEAT-CANCEL.
