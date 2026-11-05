# bufferWhen-Observable-selector: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session08-rxjs.test.mjs.

## BUFFERWHEN-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: open empty buffer; invoke initial closing selector.

Resulting state: await selector. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-INIT.

## BUFFERWHEN-CALLBACK-RETURN

Reach **Calling** with **matching selector generation**, then provide **callback.return**.

Expect, in order: connect selected closing Observable; connect source if first buffer.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CALLBACK-RETURN.

## BUFFERWHEN-CALLBACK-THROW

Reach **Calling** with **matching selector generation**, then provide **callback.throw**.

Expect, in order: forward exact thrown error; release all owned subscriptions without flush.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CALLBACK-THROW.

## BUFFERWHEN-SOURCE-NEXT

Reach **Active** with **source connected**, then provide **source.next**.

Expect, in order: append source value to every open buffer.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-SOURCE-NEXT.

## BUFFERWHEN-SOURCE-COMPLETE

Reach **Active** with **source connected**, then provide **source.complete**.

Expect, in order: flush all open buffers in opening order; complete; release resources.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-SOURCE-COMPLETE.

## BUFFERWHEN-SOURCE-ERROR

Reach **Active** with **source connected**, then provide **source.error**.

Expect, in order: forward error; dispose without flush.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-SOURCE-ERROR.

## BUFFERWHEN-CANCEL-ACTIVE

Reach **Active** with **active execution**, then provide **cancel**.

Expect, in order: release resources; do not notify downstream.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CANCEL-ACTIVE.

## BUFFERWHEN-CANCEL-CALLING

Reach **Calling** with **pending selector call, between microsteps**, then provide **cancel**.

Expect, in order: release owned subscriptions; do not notify.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CANCEL-CALLING.

## BUFFERWHEN-CLOSING-NEXT

Reach **Active** with **matching live closing generation**, then provide **closing.next**.

Expect, in order: close previous selector subscription; replace with empty buffer; emit old array; invoke next selector.

Resulting state: await selector. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CLOSING-NEXT.

## BUFFERWHEN-CLOSING-COMPLETE

Reach **Active** with **matching live closing generation**, then provide **closing.complete**.

Expect, in order: release completed closing subscription; do not flush.

Resulting state: retain exact buffer and resource bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CLOSING-COMPLETE.

## BUFFERWHEN-CLOSING-ERROR

Reach **Active** with **matching live closing generation**, then provide **closing.error**.

Expect, in order: forward closing error; release all resources.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-BUFFERWHEN-CLOSING-ERROR.
