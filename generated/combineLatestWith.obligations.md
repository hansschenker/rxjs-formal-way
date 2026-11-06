# combineLatestWith-1-observable-inputs: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session09-rxjs.test.mjs.

## COMBINELATESTWITH-INIT

Reach **Unsubscribed** with **first downstream connection**, then provide **subscribe**.

Expect, in order: acquire every input in argument order.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-INIT.

## COMBINELATESTWITH-WAIT

Reach **Active** with **live source; some other source unready**, then provide **input.next**.

Expect, in order: replace latest value; no output.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-WAIT.

## COMBINELATESTWITH-EMIT

Reach **Active** with **live source; every other source ready**, then provide **input.next**.

Expect, in order: update one latest value; emit copied source-ordered array.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-EMIT.

## COMBINELATESTWITH-COMPLETE-WAIT

Reach **Active** with **live source; another source remains live**, then provide **input.complete**.

Expect, in order: release completing input; retain latest value.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-COMPLETE-WAIT.

## COMBINELATESTWITH-COMPLETE-LAST

Reach **Active** with **final live input**, then provide **input.complete**.

Expect, in order: complete downstream; release final input.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-COMPLETE-LAST.

## COMBINELATESTWITH-ERROR

Reach **Active** with **currently subscribed input**, then provide **input.error**.

Expect, in order: propagate original error; cancel all active inputs.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-ERROR.

## COMBINELATESTWITH-CANCEL

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: unsubscribe active inputs, no terminal output.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-COMBINELATESTWITH-CANCEL.
