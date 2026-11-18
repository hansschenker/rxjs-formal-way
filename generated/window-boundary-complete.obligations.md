# window-observable-boundaries: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session21-window-rxjs.test.mjs, tests/session21-window-differential.test.mjs.

## S21-WINDOW-START

Reach **Unsubscribed** with **first result connection**, then provide **subscribe**.

Expect, in order: emit initial window handle; acquire source; acquire boundary Observable.

Resulting state: Window zero is open; both inputs are owned; no window consumer is attached yet.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-START.

## S21-WINDOW-SOURCE-NEXT

Reach **Active** with **source is live**, then provide **source.next**.

Expect, in order: deliver original value to current window consumers in attachment order.

Resulting state: The same window remains open; values are not buffered or retained for late consumers.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-SOURCE-NEXT.

## S21-WINDOW-BOUNDARY-NEXT

Reach **Active** with **boundary is live and next window identity is a safe integer**, then provide **boundary.next**.

Expect, in order: complete each current consumer and release its subscription; emit next window handle.

Resulting state: Previous window remains a completed historical handle; a new empty current window has no consumers.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-BOUNDARY-NEXT.

## S21-WINDOW-BOUNDARY-COMPLETE

Reach **Active** with **boundary is live**, then provide **boundary.complete**.

Expect, in order: release boundary input only.

Resulting state: Current window and source remain live; no further boundary events are legal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-BOUNDARY-COMPLETE.

## S21-WINDOW-SOURCE-COMPLETE

Reach **Active** with **source completes successfully**, then provide **source.complete**.

Expect, in order: complete current consumers and release their subscriptions; complete outer result; release source and any live boundary; invalidate current handle during operator teardown.

Resulting state: Outer execution stopped; older rotated handles remain completed; current handle is invalidated.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-SOURCE-COMPLETE.

## S21-WINDOW-SOURCE-ERROR

Reach **Active** with **source is live**, then provide **source.error**.

Expect, in order: error current consumers and release their subscriptions; error outer result with identical payload; release source and any live boundary; invalidate current handle.

Resulting state: Outer execution stopped with error; older completed handles are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-SOURCE-ERROR.

## S21-WINDOW-BOUNDARY-ERROR

Reach **Active** with **boundary is live**, then provide **boundary.error**.

Expect, in order: error current consumers and release their subscriptions; error outer result with identical payload; release source and any live boundary; invalidate current handle.

Resulting state: Outer execution stopped with error; older completed handles are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-BOUNDARY-ERROR.

## S21-WINDOW-CANCEL

Reach **Active** with **outer consumer cancels the result**, then provide **cancel**.

Expect, in order: release source and any live boundary; invalidate current handle without notifying or closing existing consumer subscriptions.

Resulting state: Outer execution stopped; its current consumers are orphaned until they unsubscribe themselves.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-CANCEL.

## S21-WINDOW-OBSERVER-LIVE

Reach **Active** with **fresh observer identity names the current open window**, then provide **window.subscribe**.

Expect, in order: acquire addressed window-consumer subscription; replay nothing.

Resulting state: Observer joins the current multicast window after existing consumers.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-OBSERVER-LIVE.

## S21-WINDOW-OBSERVER-COMPLETE-ACTIVE

Reach **Active** with **fresh observer identity names a previously rotated completed handle**, then provide **window.subscribe**.

Expect, in order: attempt addressed window subscription; complete observer immediately; release its subscription.

Resulting state: No active consumer or source lease is added; observer identity is recorded as used.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-OBSERVER-COMPLETE-ACTIVE.

## S21-WINDOW-OBSERVER-UNSUBSCRIBE-ACTIVE

Reach **Active** with **addressed consumer subscription remains open**, then provide **window.unsubscribe**.

Expect, in order: release only that consumer subscription.

Resulting state: Consumer is removed; source/boundary ownership and the current window do not change.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-OBSERVER-UNSUBSCRIBE-ACTIVE.

## S21-WINDOW-OBSERVER-COMPLETE-STOPPED

Reach **Stopped** with **fresh observer identity names a previously rotated completed handle**, then provide **window.subscribe**.

Expect, in order: attempt addressed window subscription; complete observer immediately; release its subscription.

Resulting state: No active consumer or source lease is added; observer identity is recorded as used.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-OBSERVER-COMPLETE-STOPPED.

## S21-WINDOW-OBSERVER-UNSUBSCRIBE-STOPPED

Reach **Stopped** with **addressed consumer subscription remains open**, then provide **window.unsubscribe**.

Expect, in order: release only that consumer subscription.

Resulting state: Consumer is removed; source/boundary ownership and the current window do not change.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S21-WINDOW-OBSERVER-UNSUBSCRIBE-STOPPED.
