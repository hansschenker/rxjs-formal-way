# windowTime-4-restart-max-unbounded: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session22-windowTime-rxjs.test.mjs, tests/session22-windowTime-differential.test.mjs.

## S22-WINDOWTIME-START

Reach **Unsubscribed** with **first connection; safe supplied scheduler time**, then provide **subscribe**.

Expect, in order: schedule recurring creation if configured; emit initial window handle; schedule its close; acquire source.

Resulting state: One empty window is live; its deadline is now + span.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-START.

## S22-WINDOWTIME-NEXT

Reach **Active** with **source is live; counts and possible new window identity remain safe**, then provide **source.next**.

Expect, in order: for each current window in order: deliver source value; complete and cancel any window reaching maxSize; restart immediately only in sequential mode.

Resulting state: Per-window counts advance; a restarted window does not receive the value that closed its predecessor.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-NEXT.

## S22-WINDOWTIME-WINDOW-TIMER

Reach **Active** with **current live window timer generation; now is at or after its deadline**, then provide **timer.window**.

Expect, in order: complete addressed window observers; cancel its timer; restart and schedule successor only in sequential mode.

Resulting state: The specified window completes without replay; historical completed handles remain usable.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-WINDOW-TIMER.

## S22-WINDOWTIME-SOURCE-COMPLETE

Reach **Active** with **source is live**, then provide **source.complete**.

Expect, in order: terminate every active window in creation order; terminate outer result; cancel creation and initial-window timers; release source; cancel later-window timers.

Resulting state: All current handles remember the source terminal; historical completed handles retain completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-SOURCE-COMPLETE.

## S22-WINDOWTIME-SOURCE-ERROR

Reach **Active** with **source is live**, then provide **source.error**.

Expect, in order: terminate every active window in creation order; terminate outer result; cancel creation and initial-window timers; release source; cancel later-window timers.

Resulting state: All current handles remember the source terminal; historical completed handles retain completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-SOURCE-ERROR.

## S22-WINDOWTIME-CANCEL

Reach **Active** with **outer connection is live**, then provide **cancel**.

Expect, in order: release timers and source in registration order without notifications.

Resulting state: Open window Subjects and their child subscriptions become silent orphans; historical handles remain usable.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-CANCEL.

## S22-WINDOWTIME-OBSERVE-OPEN-ACTIVE

Reach **Active** with **fresh observer identity names an open window**, then provide **window.subscribe**.

Expect, in order: acquire independent window observer without replay.

Resulting state: Observer joins the addressed multicast Subject, including a silent orphan after outer cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-OBSERVE-OPEN-ACTIVE.

## S22-WINDOWTIME-OBSERVE-COMPLETE-ACTIVE

Reach **Active** with **fresh observer identity names a completed window**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver completion immediately; release child observer.

Resulting state: Observer identity is recorded but no live child subscription remains.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-OBSERVE-COMPLETE-ACTIVE.

## S22-WINDOWTIME-DETACH-ACTIVE

Reach **Active** with **named child observer is attached**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed child observer.

Resulting state: Other consumers, source ownership and timer ownership do not change.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-DETACH-ACTIVE.

## S22-WINDOWTIME-OBSERVE-OPEN-STOPPED

Reach **Stopped** with **fresh observer identity names an open window**, then provide **window.subscribe**.

Expect, in order: acquire independent window observer without replay.

Resulting state: Observer joins the addressed multicast Subject, including a silent orphan after outer cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-OBSERVE-OPEN-STOPPED.

## S22-WINDOWTIME-OBSERVE-COMPLETE-STOPPED

Reach **Stopped** with **fresh observer identity names a completed window**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver completion immediately; release child observer.

Resulting state: Observer identity is recorded but no live child subscription remains.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-OBSERVE-COMPLETE-STOPPED.

## S22-WINDOWTIME-DETACH-STOPPED

Reach **Stopped** with **named child observer is attached**, then provide **window.unsubscribe**.

Expect, in order: release only the addressed child observer.

Resulting state: Other consumers, source ownership and timer ownership do not change.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-DETACH-STOPPED.

## S22-WINDOWTIME-OBSERVE-ERROR-STOPPED

Reach **Stopped** with **fresh observer names a window failed by the source**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver retained error by identity; release child observer.

Resulting state: Failed handle remains failed; no source values are replayed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWTIME-OBSERVE-ERROR-STOPPED.
