# mergeWith-unbounded-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session15-rxjs.test.mjs, tests/mergeWith-refinement.test.mjs.

## S15-MERGEWITH-INIT

Reach **Unsubscribed** with **first consumer connection**, then provide **subscribe**.

Expect, in order: subscribe source 0 first, then every configured other input in argument order.

Resulting state: Active; live inputs are 0 through 2; pending is empty. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-INIT.

## S15-MERGEWITH-NEXT

Reach **Active** with **input resource belongs to the current live-input set**, then provide **input.next**.

Expect, in order: forward the exact input payload once.

Resulting state: Active; the live-input set is unchanged; pending remains empty. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-NEXT.

## S15-MERGEWITH-COMPLETE-WAIT

Reach **Active** with **the completing input is live and at least one other input remains live**, then provide **input.complete**.

Expect, in order: release the completed input; emit no result notification.

Resulting state: Active; remove the completed input from the live-input set; pending remains empty. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-COMPLETE-WAIT.

## S15-MERGEWITH-COMPLETE-LAST

Reach **Active** with **the completing input is the only live input**, then provide **input.complete**.

Expect, in order: release the final input and run its registered teardown; complete the result.

Resulting state: Closed with reason complete; no owned input subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-COMPLETE-LAST.

## S15-MERGEWITH-ERROR

Reach **Active** with **the failing input belongs to the live-input set**, then provide **input.error**.

Expect, in order: forward the exact error; release every live input in subscription order.

Resulting state: Closed with reason input-error; no owned input subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-ERROR.

## S15-MERGEWITH-CANCEL

Reach **Active** with **the result is Active and the consumer unsubscribes**, then provide **cancel**.

Expect, in order: release every live input in subscription order; emit no result notification.

Resulting state: Closed with reason cancel; no owned input subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-MERGEWITH-CANCEL.
