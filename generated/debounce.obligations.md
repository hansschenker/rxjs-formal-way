# debounce-Observable-duration: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session10-rxjs.test.mjs.

## DEBOUNCE-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-INIT.

## DEBOUNCE-NEW-VALUE

Reach **Active** with **source live; pending duration may exist**, then provide **source.next**.

Expect, in order: cancel old duration if live; replace cached value; invoke duration selector.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-NEW-VALUE.

## DEBOUNCE-DURATION-RETURN

Reach **Calling** with **matching pending selector invocation**, then provide **callback.return**.

Expect, in order: subscribe selected duration Observable.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-DURATION-RETURN.

## DEBOUNCE-DURATION-THROW

Reach **Calling** with **matching selector invocation**, then provide **callback.throw**.

Expect, in order: propagate exact thrown error; release source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-DURATION-THROW.

## DEBOUNCE-DURATION-NEXT

Reach **Active** with **matching live duration**, then provide **duration.next**.

Expect, in order: unsubscribe duration; emit cached latest value once.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-DURATION-NEXT.

## DEBOUNCE-DURATION-EMPTY

Reach **Active** with **matching live duration completed without next**, then provide **duration.complete**.

Expect, in order: release duration; retain latest value.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-DURATION-EMPTY.

## DEBOUNCE-DURATION-ERROR

Reach **Active** with **matching live duration**, then provide **duration.error**.

Expect, in order: propagate exact error; release duration and source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-DURATION-ERROR.

## DEBOUNCE-SOURCE-COMPLETE

Reach **Active** with **source completes**, then provide **source.complete**.

Expect, in order: cancel live duration; flush cached value if present; complete; release source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-SOURCE-COMPLETE.

## DEBOUNCE-SOURCE-ERROR-ACTIVE

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward error and release owned resources.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-SOURCE-ERROR-ACTIVE.

## DEBOUNCE-CANCEL-ACTIVE

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: release active duration and source silently.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-CANCEL-ACTIVE.

## DEBOUNCE-SOURCE-ERROR-CALLING

Reach **Calling** with **source errors**, then provide **source.error**.

Expect, in order: forward error and release owned resources.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-SOURCE-ERROR-CALLING.

## DEBOUNCE-CANCEL-CALLING

Reach **Calling** with **downstream cancels**, then provide **cancel**.

Expect, in order: release active duration and source silently.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEBOUNCE-CANCEL-CALLING.
