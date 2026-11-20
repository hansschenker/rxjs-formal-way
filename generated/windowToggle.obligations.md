# windowToggle-signals: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session22-windowToggle-rxjs.test.mjs, tests/session22-windowToggle-differential.test.mjs.

## S22-WINDOWTOGGLE-START

Reach **Unsubscribed** with **first result connection**, then provide **subscribe**.

Expect, in order: subscribe opening signal; subscribe source; emit no initial window.

Resulting state: Active, no windows or consumers; opening signal is live.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-START.

## S22-WINDOWTOGGLE-OPEN

Reach **Active** with **opening signal is live and next identity can advance safely**, then provide **opening.next**.

Expect, in order: create unannounced window record; invoke closingSelector with exact opening payload.

Resulting state: Selecting with one pending window identity; no handle has been emitted for it.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OPEN.

## S22-WINDOWTOGGLE-SELECTOR-RETURN

Reach **Selecting** with **matching synchronous selector returns a valid Observable**, then provide **selector.return**.

Expect, in order: announce Observable handle; subscribe its closing signal.

Resulting state: Pending window becomes open, announced and attached to its uniquely identified closing subscription.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-SELECTOR-RETURN.

## S22-WINDOWTOGGLE-SELECTOR-THROW

Reach **Selecting** with **matching synchronous selector throws**, then provide **selector.throw**.

Expect, in order: error open window consumers; error outer result; release opening, source and live closings.

Resulting state: Stopped with retained errored handles; failed pending window was never announced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-SELECTOR-THROW.

## S22-WINDOWTOGGLE-SOURCE-NEXT

Reach **Active** with **source is connected between atomic reactions**, then provide **source.next**.

Expect, in order: send the same value to each open window consumer in window creation and observer attachment order.

Resulting state: All window and closing state remains unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-SOURCE-NEXT.

## S22-WINDOWTOGGLE-CLOSING-NEXT

Reach **Active** with **addressed closing subscription is live**, then provide **closing.next**.

Expect, in order: complete this window consumers; release this closing subscription.

Resulting state: Window retains completion; other windows, source and opening signal are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-CLOSING-NEXT.

## S22-WINDOWTOGGLE-CLOSING-COMPLETE

Reach **Active** with **addressed closing subscription is live**, then provide **closing.complete**.

Expect, in order: release this closing subscription only.

Resulting state: Window stays open without a live closing signal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-CLOSING-COMPLETE.

## S22-WINDOWTOGGLE-OPENING-COMPLETE

Reach **Active** with **opening subscription is live**, then provide **opening.complete**.

Expect, in order: release opening subscription only.

Resulting state: No more windows can open; source and current windows continue.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OPENING-COMPLETE.

## S22-WINDOWTOGGLE-SOURCE-ERROR

Reach **Active** with **source is connected**, then provide **source.error**.

Expect, in order: error every open window consumer before outer error; release opening, source and remaining closings.

Resulting state: Stopped; failed windows retain their exact error for late observers; completed windows remain completed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-SOURCE-ERROR.

## S22-WINDOWTOGGLE-CLOSING-ERROR

Reach **Active** with **addressed closing subscription is live**, then provide **closing.error**.

Expect, in order: error every open window consumer before outer error; release opening, source and remaining closings.

Resulting state: Stopped; failed windows retain their exact error for late observers; completed windows remain completed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-CLOSING-ERROR.

## S22-WINDOWTOGGLE-SOURCE-COMPLETE

Reach **Active** with **source is connected**, then provide **source.complete**.

Expect, in order: complete all open window consumers before outer completion; release opening, source and live closings.

Resulting state: Stopped; every announced window retains completion and can complete late consumers.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-SOURCE-COMPLETE.

## S22-WINDOWTOGGLE-OPENING-ERROR

Reach **Active** with **opening subscription is live**, then provide **opening.error**.

Expect, in order: error outer result only; release opening, source and live closings; dispose current Subjects silently.

Resulting state: Stopped; current handles are disposed and existing child subscriptions remain orphaned.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OPENING-ERROR.

## S22-WINDOWTOGGLE-CANCEL

Reach **Active** with **outer consumer cancels between reactions**, then provide **cancel**.

Expect, in order: release opening, source and live closings; dispose current Subjects silently.

Resulting state: Stopped; attached child Subscriptions remain independently closeable and current handles reject late subscription.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-CANCEL.

## S22-WINDOWTOGGLE-OBSERVE-OPEN

Reach **Active** with **fresh observer names an announced open window**, then provide **window.subscribe**.

Expect, in order: acquire one child observer connection without replay.

Resulting state: Consumer is attached; no upstream lease is added.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVE-OPEN.

## S22-WINDOWTOGGLE-OBSERVE-COMPLETE-ACTIVE

Reach **Active** with **fresh observer names an announced complete window**, then provide **window.subscribe**.

Expect, in order: acquire observer; deliver retained terminal notification without value replay; release observer.

Resulting state: No consumer remains attached; the historical handle retains its terminal state.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVE-COMPLETE-ACTIVE.

## S22-WINDOWTOGGLE-OBSERVER-CLOSE-ACTIVE

Reach **Active** with **addressed child observer still owns a subscription**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed observer.

Resulting state: Other children and upstream resources are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVER-CLOSE-ACTIVE.

## S22-WINDOWTOGGLE-OBSERVE-COMPLETE-STOPPED

Reach **Stopped** with **fresh observer names an announced complete window**, then provide **window.subscribe**.

Expect, in order: acquire observer; deliver retained terminal notification without value replay; release observer.

Resulting state: No consumer remains attached; the historical handle retains its terminal state.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVE-COMPLETE-STOPPED.

## S22-WINDOWTOGGLE-OBSERVE-ERROR-STOPPED

Reach **Stopped** with **fresh observer names an announced error window**, then provide **window.subscribe**.

Expect, in order: acquire observer; deliver retained terminal notification without value replay; release observer.

Resulting state: No consumer remains attached; the historical handle retains its terminal state.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVE-ERROR-STOPPED.

## S22-WINDOWTOGGLE-OBSERVER-CLOSE-STOPPED

Reach **Stopped** with **addressed child observer still owns a subscription**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed observer.

Resulting state: Other children and upstream resources are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTOGGLE-OBSERVER-CLOSE-STOPPED.
