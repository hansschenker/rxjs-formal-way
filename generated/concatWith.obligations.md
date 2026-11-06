# concatWith-2-observable-inputs: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session09-rxjs.test.mjs.

## CONCATWITH-INIT

Reach **Unsubscribed** with **first downstream connection**, then provide **subscribe**.

Expect, in order: acquire source index zero.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-INIT.

## CONCATWITH-NEXT

Reach **Active** with **only active input**, then provide **input.next**.

Expect, in order: forward value unchanged.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-NEXT.

## CONCATWITH-COMPLETE-ADVANCE

Reach **Active** with **next input exists**, then provide **input.complete**.

Expect, in order: release current input; connect next source.

Resulting state: valid ordered input bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-COMPLETE-ADVANCE.

## CONCATWITH-COMPLETE-LAST

Reach **Active** with **last input has completed**, then provide **input.complete**.

Expect, in order: complete downstream; release final input.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-COMPLETE-LAST.

## CONCATWITH-ERROR

Reach **Active** with **currently subscribed input**, then provide **input.error**.

Expect, in order: propagate original error; cancel all active inputs.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-ERROR.

## CONCATWITH-CANCEL

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: unsubscribe active inputs, no terminal output.

Resulting state: terminal; resources discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S9-CONCATWITH-CANCEL.
