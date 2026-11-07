# delay-fixed-timer-3: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session10-rxjs.test.mjs.

## DELAY-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-INIT.

## DELAY-SOURCE-NEXT

Reach **Active** with **source live; timer mode**, then provide **source.next**.

Expect, in order: remember input as independent pending timer; schedule due.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SOURCE-NEXT.

## DELAY-SOURCE-SELECT

Reach **Active** with **source live; selector mode**, then provide **source.next**.

Expect, in order: retain source value; request indexed duration selector.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SOURCE-SELECT.

## DELAY-SELECTOR-RETURN

Reach **Active** with **matching pending callback**, then provide **callback.return**.

Expect, in order: subscribe returned duration.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SELECTOR-RETURN.

## DELAY-SELECTOR-THROW

Reach **Active** with **matching pending callback**, then provide **callback.throw**.

Expect, in order: error; release outer and all admitted durations.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SELECTOR-THROW.

## DELAY-TIMER-FIRE

Reach **Active** with **current timer at/after deadline; source remains live or peers pending**, then provide **timer.fire**.

Expect, in order: cancel timer; emit its source payload.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-TIMER-FIRE.

## DELAY-TIMER-FINAL

Reach **Active** with **last timer at/after deadline and source already complete**, then provide **timer.fire**.

Expect, in order: emit value; complete.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-TIMER-FINAL.

## DELAY-DURATION-NEXT-Active

Reach **Active** with **matching selected duration; closed only after outer finished and last item**, then provide **duration.next**.

Expect, in order: emit pending value after first duration next.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-DURATION-NEXT-Active.

## DELAY-DURATION-NEXT-Closed

Reach **Active** with **matching selected duration; closed only after outer finished and last item**, then provide **duration.next**.

Expect, in order: emit pending value after first duration next.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-DURATION-NEXT-Closed.

## DELAY-DURATION-EMPTY-Active

Reach **Active** with **matching selected duration; closed only after outer finished and last item**, then provide **duration.complete**.

Expect, in order: discard pending value after empty completion.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-DURATION-EMPTY-Active.

## DELAY-DURATION-EMPTY-Closed

Reach **Active** with **matching selected duration; closed only after outer finished and last item**, then provide **duration.complete**.

Expect, in order: discard pending value after empty completion.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-DURATION-EMPTY-Closed.

## DELAY-DURATION-ERROR

Reach **Active** with **matching selected duration**, then provide **duration.error**.

Expect, in order: error and release all subscriptions.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-DURATION-ERROR.

## DELAY-SOURCE-COMPLETE-WAIT

Reach **Active** with **some pending duration remains**, then provide **source.complete**.

Expect, in order: release source, await durations.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SOURCE-COMPLETE-WAIT.

## DELAY-SOURCE-COMPLETE-EMPTY

Reach **Active** with **no pending durations**, then provide **source.complete**.

Expect, in order: complete and release source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SOURCE-COMPLETE-EMPTY.

## DELAY-SOURCE-ERROR

Reach **Active** with **source live**, then provide **source.error**.

Expect, in order: propagate error and cancel all pending durations.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-SOURCE-ERROR.

## DELAY-CANCEL

Reach **Active** with **downstream unsubscribed**, then provide **cancel**.

Expect, in order: cancel pending durations and live source; no terminal output.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DELAY-CANCEL.
