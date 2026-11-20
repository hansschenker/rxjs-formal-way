# windowWhen-deferred-closing: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session22-windowWhen-rxjs.test.mjs, tests/session22-windowWhen-differential.test.mjs.

## S22-WINDOWWHEN-START

Reach **Unsubscribed** with **no result connection exists**, then provide **subscribe**.

Expect, in order: emit initial window handle zero; invoke closing selector zero with no argument.

Resulting state: Initial window is open; source and closing connections await the synchronous factory outcome.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-START.

## S22-WINDOWWHEN-FACTORY-RETURN

Reach **Selecting** with **outcome belongs to the current synchronous invocation**, then provide **factory.return**.

Expect, in order: acquire closing subscription occurrence; acquire source only for initial setup.

Resulting state: One closing occurrence watches the open window; source is connected exactly once.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-FACTORY-RETURN.

## S22-WINDOWWHEN-FACTORY-THROW

Reach **Selecting** with **throw belongs to the current synchronous invocation**, then provide **factory.throw**.

Expect, in order: remember error on newly announced window; error outer; release source, or record closed-source acquisition attempt during initial setup.

Resulting state: New window retains the exact error; old windows remain completed.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-FACTORY-THROW.

## S22-WINDOWWHEN-SOURCE-NEXT

Reach **Active** with **source connection is live**, then provide **source.next**.

Expect, in order: forward identical payload to every observer of the current window in attachment order.

Resulting state: No values are buffered and no closing state changes.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-SOURCE-NEXT.

## S22-WINDOWWHEN-CLOSING-NEXT

Reach **Active** with **current closing generation; next window identity remains a safe integer**, then provide **closing.next**.

Expect, in order: unsubscribe old closing occurrence; complete and release old window consumers; emit successor handle; invoke next closing selector.

Resulting state: Old window remembers completion; a new empty window awaits its factory result.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-CLOSING-NEXT.

## S22-WINDOWWHEN-CLOSING-COMPLETE

Reach **Active** with **current closing generation; next window identity remains a safe integer**, then provide **closing.complete**.

Expect, in order: unsubscribe old closing occurrence; complete and release old window consumers; emit successor handle; invoke next closing selector.

Resulting state: Old window remembers completion; a new empty window awaits its factory result.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-CLOSING-COMPLETE.

## S22-WINDOWWHEN-SOURCE-COMPLETE

Reach **Active** with **source connection is live**, then provide **source.complete**.

Expect, in order: complete current children; complete outer; disconnect inputs in subscription ownership order.

Resulting state: Every retained window is completed; no replacement window is created.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-SOURCE-COMPLETE.

## S22-WINDOWWHEN-SOURCE-ERROR

Reach **Active** with **live source, or matching current closing generation**, then provide **source.error**.

Expect, in order: error current children with original payload; error outer; disconnect inputs in subscription ownership order.

Resulting state: Current handle remembers failure; older handles retain successful completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-SOURCE-ERROR.

## S22-WINDOWWHEN-CLOSING-ERROR

Reach **Active** with **live source, or matching current closing generation**, then provide **closing.error**.

Expect, in order: error current children with original payload; error outer; disconnect inputs in subscription ownership order.

Resulting state: Current handle remembers failure; older handles retain successful completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-CLOSING-ERROR.

## S22-WINDOWWHEN-CANCEL

Reach **Active** with **outer connection closes between complete reactions**, then provide **cancel**.

Expect, in order: disconnect inputs silently in subscription ownership order.

Resulting state: Current Subject stays open but orphaned; existing child subscriptions remain independently owned.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-CANCEL.

## S22-WINDOWWHEN-OBSERVE-OPEN-ACTIVE

Reach **Active** with **fresh observer identity names a retained open window**, then provide **window.subscribe**.

Expect, in order: acquire child observer, no replay.

Resulting state: Child is attached independently to the open Subject.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVE-OPEN-ACTIVE.

## S22-WINDOWWHEN-OBSERVE-COMPLETE-ACTIVE

Reach **Active** with **fresh observer identity names a retained complete window**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver retained terminal only; release child observer.

Resulting state: No child remains attached to a terminated Subject.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVE-COMPLETE-ACTIVE.

## S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-ACTIVE

Reach **Active** with **named observer owns a live child subscription**, then provide **window.unsubscribe**.

Expect, in order: release only that child subscription.

Resulting state: All peers, window handles and upstream connections are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-ACTIVE.

## S22-WINDOWWHEN-OBSERVE-OPEN-STOPPED

Reach **Stopped** with **fresh observer identity names a retained open window**, then provide **window.subscribe**.

Expect, in order: acquire child observer, no replay.

Resulting state: Child is attached independently to the open Subject.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVE-OPEN-STOPPED.

## S22-WINDOWWHEN-OBSERVE-COMPLETE-STOPPED

Reach **Stopped** with **fresh observer identity names a retained complete window**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver retained terminal only; release child observer.

Resulting state: No child remains attached to a terminated Subject.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVE-COMPLETE-STOPPED.

## S22-WINDOWWHEN-OBSERVE-ERROR-STOPPED

Reach **Stopped** with **fresh observer identity names a retained error window**, then provide **window.subscribe**.

Expect, in order: acquire child observer; deliver retained terminal only; release child observer.

Resulting state: No child remains attached to a terminated Subject.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVE-ERROR-STOPPED.

## S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-STOPPED

Reach **Stopped** with **named observer owns a live child subscription**, then provide **window.unsubscribe**.

Expect, in order: release only that child subscription.

Resulting state: All peers, window handles and upstream connections are unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-STOPPED.
