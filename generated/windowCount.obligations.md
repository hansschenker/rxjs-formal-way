# windowCount-3-stride-1: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session22-windowCount-rxjs.test.mjs.

## S22-WINDOWCOUNT-START

Reach **Unsubscribed** with **no upstream connection exists**, then provide **subscribe**.

Expect, in order: emit initial Observable handle 0; subscribe to source.

Resulting state: Window zero is open and empty before the source is connected.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-START.

## S22-WINDOWCOUNT-NEXT

Reach **Active** with **safe source count and window identity**, then provide **source.next**.

Expect, in order: send source value to each open window observer; complete oldest due window; open next window after delivery at stride boundary.

Resulting state: Count advances; windows are completed or opened without replaying values.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-NEXT.

## S22-WINDOWCOUNT-SOURCE-COMPLETE

Reach **Active** with **source is live**, then provide **source.complete**.

Expect, in order: complete each open child before outer completion; complete outer result; release source.

Resulting state: All remaining open handles remember completion; completed historical handles are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-SOURCE-COMPLETE.

## S22-WINDOWCOUNT-SOURCE-ERROR

Reach **Active** with **source is live**, then provide **source.error**.

Expect, in order: error each open child with same error identity; error outer result; release source.

Resulting state: Open handles retain the terminal error for late observers; earlier completed windows remain completed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-SOURCE-ERROR.

## S22-WINDOWCOUNT-CANCEL

Reach **Active** with **outer subscriber cancels between events**, then provide **cancel**.

Expect, in order: release source subscription silently.

Resulting state: Current open Subjects and their consumer subscriptions remain orphaned, unlike window(boundaries).. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-CANCEL.

## S22-WINDOWCOUNT-OBSERVE-OPEN-ACTIVE

Reach **Active** with **fresh observer ID names an open window; after stop, only cancelled windows stay open**, then provide **window.subscribe**.

Expect, in order: acquire one named window observer subscription, no replay.

Resulting state: Observer joins the specified live Subject; no additional source subscription is made.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVE-OPEN-ACTIVE.

## S22-WINDOWCOUNT-OBSERVE-COMPLETE-ACTIVE

Reach **Active** with **fresh observer ID names a completed window**, then provide **window.subscribe**.

Expect, in order: subscribe and synchronously complete the new window observer; release observer subscription.

Resulting state: No consumer remains attached; this completed Subject does not replay any values.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVE-COMPLETE-ACTIVE.

## S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-ACTIVE

Reach **Active** with **addressed observer owns an open window subscription**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed child subscription.

Resulting state: Window and all other consumers are unchanged; source lifetime remains independently owned.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-ACTIVE.

## S22-WINDOWCOUNT-OBSERVE-OPEN-STOPPED

Reach **Stopped** with **fresh observer ID names an open window; after stop, only cancelled windows stay open**, then provide **window.subscribe**.

Expect, in order: acquire one named window observer subscription, no replay.

Resulting state: Observer joins the specified live Subject; no additional source subscription is made.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVE-OPEN-STOPPED.

## S22-WINDOWCOUNT-OBSERVE-COMPLETE-STOPPED

Reach **Stopped** with **fresh observer ID names a completed window**, then provide **window.subscribe**.

Expect, in order: subscribe and synchronously complete the new window observer; release observer subscription.

Resulting state: No consumer remains attached; this completed Subject does not replay any values.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVE-COMPLETE-STOPPED.

## S22-WINDOWCOUNT-OBSERVE-ERROR-STOPPED

Reach **Stopped** with **fresh observer names a failed window, which can occur only after source error**, then provide **window.subscribe**.

Expect, in order: subscribe and immediately replay terminal error only; release observer subscription.

Resulting state: Observer is terminated with the same error identity; no value replay.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVE-ERROR-STOPPED.

## S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-STOPPED

Reach **Stopped** with **addressed observer owns an open window subscription**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed child subscription.

Resulting state: Window and all other consumers are unchanged; source lifetime remains independently owned.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-STOPPED.
