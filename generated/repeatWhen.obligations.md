# repeatWhen-persistent-notifier-post-setup: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session17-rxjs.test.mjs.

## S17-REPEATWHEN-START

Reach **Unsubscribed** with **first downstream connection**, then provide **subscribe**.

Expect, in order: subscribe source generation 0.

Resulting state: Active with no notifier.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-START.

## S17-REPEATWHEN-VALUE

Reach **Active** with **source generation is current**, then provide **source.next**.

Expect, in order: forward source value unchanged.

Resulting state: Current generation and notifier state unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-VALUE.

## S17-REPEATWHEN-FIRST-SOURCE-COMPLETE

Reach **Active** with **current source completes, and notifier has never been constructed**, then provide **source.complete**.

Expect, in order: unsubscribe the completed source; subscribe to single notifier; emit void to completion Subject.

Resulting state: Waiting for first notifier next or terminal notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-FIRST-SOURCE-COMPLETE.

## S17-REPEATWHEN-SOURCE-COMPLETE-WAIT

Reach **Active** with **current source completes and notifier is still open**, then provide **source.complete**.

Expect, in order: unsubscribe source; emit one void completion Subject signal.

Resulting state: Waiting with the notifier still open.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-SOURCE-COMPLETE-WAIT.

## S17-REPEATWHEN-SOURCE-COMPLETE-STOP

Reach **Active** with **current source completes after notifier has completed**, then provide **source.complete**.

Expect, in order: unsubscribe final source; complete downstream.

Resulting state: Closed successfully; no source or notifier connection.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-SOURCE-COMPLETE-STOP.

## S17-REPEATWHEN-RESTART

Reach **Waiting** with **notifier is open and source has completed**, then provide **notifier.next**.

Expect, in order: subscribe one new source generation.

Resulting state: Active at next source generation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-RESTART.

## S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT

Reach **Waiting** with **notifier completes with main source finished**, then provide **notifier.complete**.

Expect, in order: unsubscribe notifier; complete downstream.

Resulting state: Closed successfully.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT.

## S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE

Reach **Active** with **notifier completes while restarted source is still active**, then provide **notifier.complete**.

Expect, in order: release notifier without terminating current source.

Resulting state: Active with notifier completed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE.

## S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE

Reach **Active** with **notifier is open**, then provide **notifier.error**.

Expect, in order: forward exact notifier error; release all live resources.

Resulting state: Closed in error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE.

## S17-REPEATWHEN-CANCEL-ACTIVE

Reach **Active** with **downstream cancellation**, then provide **cancel**.

Expect, in order: dispose current source if active; dispose notifier if open; no terminal notification.

Resulting state: Closed by cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-CANCEL-ACTIVE.

## S17-REPEATWHEN-NOTIFIER-ERROR-WAITING

Reach **Waiting** with **notifier is open**, then provide **notifier.error**.

Expect, in order: forward exact notifier error; release all live resources.

Resulting state: Closed in error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-NOTIFIER-ERROR-WAITING.

## S17-REPEATWHEN-CANCEL-WAITING

Reach **Waiting** with **downstream cancellation**, then provide **cancel**.

Expect, in order: dispose current source if active; dispose notifier if open; no terminal notification.

Resulting state: Closed by cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-CANCEL-WAITING.

## S17-REPEATWHEN-SOURCE-ERROR

Reach **Active** with **current source generation fails**, then provide **source.error**.

Expect, in order: error downstream immediately; release source and existing notifier.

Resulting state: Closed in error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-REPEATWHEN-SOURCE-ERROR.
