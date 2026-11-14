# retry-bounded-restart-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session17-rxjs.test.mjs.

## S17-RETRY-START

Reach **Unsubscribed** with **first downstream subscription**, then provide **subscribe**.

Expect, in order: subscribe source generation 0.

Resulting state: Active with attempt=1 and failure counter=0.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-START.

## S17-RETRY-NEXT

Reach **Active** with **matching live source generation**, then provide **source.next**.

Expect, in order: forward value unchanged.

Resulting state: Remain Active with the current generation and updated failure counter.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-NEXT.

## S17-RETRY-COMPLETE

Reach **Active** with **successful source completion**, then provide **source.complete**.

Expect, in order: complete downstream and release source.

Resulting state: Closed complete.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-COMPLETE.

## S17-RETRY-RETRY

Reach **Active** with **matching source and failureCount<count**, then provide **source.error**.

Expect, in order: release failed source; subscribe next source execution.

Resulting state: New generation active; failure counter and attempt incremented.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-RETRY.

## S17-RETRY-RETRY-EXHAUSTED

Reach **Active** with **matching error and retry budget exhausted**, then provide **source.error**.

Expect, in order: emit original error unchanged; dispose final source.

Resulting state: Closed in error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-RETRY-EXHAUSTED.

## S17-RETRY-CANCEL

Reach **Active** with **downstream cancels active subscription**, then provide **cancel**.

Expect, in order: release current source without an output notification.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RETRY-CANCEL.
