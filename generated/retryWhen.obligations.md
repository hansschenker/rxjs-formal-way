# retryWhen-persistent-errors-notifier: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session18-rxjs.test.mjs.

## S18-RETRYWHEN-START

Reach **Unsubscribed** with **first result subscription**, then provide **subscribe**.

Expect, in order: subscribe source generation 0.

Resulting state: Active with no notifier.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-START.

## S18-RETRYWHEN-FORWARD

Reach **Active** with **current source generation sends a value**, then provide **source.next**.

Expect, in order: forward original payload exactly once.

Resulting state: Same current source and notifier state.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-FORWARD.

## S18-RETRYWHEN-FIRST-ERROR

Reach **Active** with **matching source error and notifier absent**, then provide **source.error**.

Expect, in order: release errored source; subscribe to persistent notifier; send original error to errors Subject.

Resulting state: Waiting for notifier next, complete or error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-FIRST-ERROR.

## S18-RETRYWHEN-LATER-ERROR

Reach **Active** with **matching source error and notifier already open**, then provide **source.error**.

Expect, in order: release errored source; notify original error on existing Subject.

Resulting state: Waiting for the next notifier decision.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-LATER-ERROR.

## S18-RETRYWHEN-RETRY

Reach **Waiting** with **one notifier next while source is stopped**, then provide **notifier.next**.

Expect, in order: subscribe fresh source generation.

Resulting state: Active with next source generation; notifier remains open.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-RETRY.

## S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE

Reach **Active** with **open notifier completes**, then provide **notifier.complete**.

Expect, in order: complete downstream; release all live resources.

Resulting state: Closed successfully.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE.

## S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE

Reach **Active** with **open notifier errors**, then provide **notifier.error**.

Expect, in order: forward exact notifier error; release active source and notifier.

Resulting state: Closed on notifier error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE.

## S18-RETRYWHEN-CANCEL-ACTIVE

Reach **Active** with **consumer cancels**, then provide **cancel**.

Expect, in order: release source if live; release notifier if already allocated; no output notification.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-CANCEL-ACTIVE.

## S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING

Reach **Waiting** with **open notifier completes**, then provide **notifier.complete**.

Expect, in order: complete downstream; release all live resources.

Resulting state: Closed successfully.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING.

## S18-RETRYWHEN-NOTIFIER-ERROR-WAITING

Reach **Waiting** with **open notifier errors**, then provide **notifier.error**.

Expect, in order: forward exact notifier error; release active source and notifier.

Resulting state: Closed on notifier error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-NOTIFIER-ERROR-WAITING.

## S18-RETRYWHEN-CANCEL-WAITING

Reach **Waiting** with **consumer cancels**, then provide **cancel**.

Expect, in order: release source if live; release notifier if already allocated; no output notification.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-CANCEL-WAITING.

## S18-RETRYWHEN-SOURCE-COMPLETE

Reach **Active** with **matching source generation completes**, then provide **source.complete**.

Expect, in order: complete downstream; release source and notifier if present.

Resulting state: Closed complete.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-RETRYWHEN-SOURCE-COMPLETE.
