# pairwise-reference: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session4-rxjs.test.mjs.

## PAIRWISE-INIT

Reach **Unsubscribed** with **new execution**, then provide **subscribe**.

Expect, in order: subscribe source; no previous value yet.

Resulting state: active with no previous item. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-INIT.

## PAIRWISE-FIRST

Reach **Active** with **no previous source value**, then provide **source.next**.

Expect, in order: remember the first source value without emitting.

Resulting state: active remembering the first value. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-FIRST.

## PAIRWISE-NEXT

Reach **Active** with **previous value remembered**, then provide **source.next**.

Expect, in order: store current value before emitting [previous, current].

Resulting state: active remembering the current value. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-NEXT.

## PAIRWISE-COMPLETE

Reach **Active** with **source finishes with any number of values**, then provide **source.complete**.

Expect, in order: forward completion without flushing an incomplete pair; release source.

Resulting state: closed after completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-LIFECYCLE.

## PAIRWISE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward the original error; release source.

Resulting state: closed after error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-LIFECYCLE.

## PAIRWISE-CANCEL

Reach **Active** with **downstream unsubscribes**, then provide **cancel**.

Expect, in order: release source without completion.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-PAIRWISE-LIFECYCLE.
