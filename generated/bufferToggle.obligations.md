# bufferToggle-Observable-selector: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session08-rxjs.test.mjs.

## BUFFERTOGGLE-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: connect openings; connect source.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-INIT.

## BUFFERTOGGLE-CALLBACK-RETURN

Reach **Calling** with **matching selector generation**, then provide **callback.return**.

Expect, in order: connect selected closing Observable; connect source if first buffer.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CALLBACK-RETURN.

## BUFFERTOGGLE-CALLBACK-THROW

Reach **Calling** with **matching selector generation**, then provide **callback.throw**.

Expect, in order: forward exact thrown error; release all owned subscriptions without flush.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CALLBACK-THROW.

## BUFFERTOGGLE-SOURCE-NEXT

Reach **Active** with **source connected**, then provide **source.next**.

Expect, in order: append source value to every open buffer.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-SOURCE-NEXT.

## BUFFERTOGGLE-SOURCE-COMPLETE

Reach **Active** with **source connected**, then provide **source.complete**.

Expect, in order: flush all open buffers in opening order; complete; release resources.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-SOURCE-COMPLETE.

## BUFFERTOGGLE-SOURCE-ERROR

Reach **Active** with **source connected**, then provide **source.error**.

Expect, in order: forward error; dispose without flush.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-SOURCE-ERROR.

## BUFFERTOGGLE-CANCEL-ACTIVE

Reach **Active** with **active execution**, then provide **cancel**.

Expect, in order: release resources; do not notify downstream.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CANCEL-ACTIVE.

## BUFFERTOGGLE-CANCEL-CALLING

Reach **Calling** with **pending selector call, between microsteps**, then provide **cancel**.

Expect, in order: release owned subscriptions; do not notify.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CANCEL-CALLING.

## BUFFERTOGGLE-CLOSING-NEXT

Reach **Active** with **matching live closing generation**, then provide **closing.next**.

Expect, in order: remove selected buffer; emit array; unsubscribe selected closing.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CLOSING-NEXT.

## BUFFERTOGGLE-CLOSING-COMPLETE

Reach **Active** with **matching live closing generation**, then provide **closing.complete**.

Expect, in order: release completed closing subscription; do not flush.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CLOSING-COMPLETE.

## BUFFERTOGGLE-CLOSING-ERROR

Reach **Active** with **matching live closing generation**, then provide **closing.error**.

Expect, in order: forward closing error; release all resources.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-CLOSING-ERROR.

## BUFFERTOGGLE-OPENINGS-NEXT

Reach **Active** with **openings still subscribed, safe generation**, then provide **openings.next**.

Expect, in order: add open buffer; invoke closing selector with opening value.

Resulting state: await selector. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-OPENINGS-NEXT.

## BUFFERTOGGLE-OPENINGS-COMPLETE

Reach **Active** with **openings still subscribed**, then provide **openings.complete**.

Expect, in order: release openings subscription; preserve buffers and source.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-OPENINGS-COMPLETE.

## BUFFERTOGGLE-OPENINGS-ERROR

Reach **Active** with **openings still subscribed**, then provide **openings.error**.

Expect, in order: forward error; release all resources without flush.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERTOGGLE-OPENINGS-ERROR.
