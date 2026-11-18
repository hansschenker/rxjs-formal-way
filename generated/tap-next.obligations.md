# tap-next: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-TAP-START

Reach **Unsubscribed** with **first consumer connection**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: Listening with next notification invocation index zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-START.

## S20-TAP-NEXT-CALL

Reach **Listening** with **source is live; matching hook is configured**, then provide **source.next**.

Expect, in order: invoke the matching hook with the source notification payload.

Resulting state: Calling next with the original notification retained; only its correlated outcome is legal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-NEXT-CALL.

## S20-TAP-NEXT-RETURN

Reach **Calling** with **return matches the pending next invocation**, then provide **callback.return**.

Expect, in order: forward the exact original value.

Resulting state: Listening; advance invocation index and clear pending notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-NEXT-RETURN.

## S20-TAP-NEXT-THROW

Reach **Calling** with **throw matches the pending next invocation**, then provide **callback.throw**.

Expect, in order: error with the exact thrown value instead of the pending notification; release source.

Resulting state: Closed error; discard pending notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-NEXT-THROW.

## S20-TAP-ERROR-PASS

Reach **Listening** with **source is live; matching hook is absent**, then provide **source.error**.

Expect, in order: forward the unchanged notification; release source and invoke configured finalize hook.

Resulting state: Closed after source termination.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-ERROR-PASS.

## S20-TAP-COMPLETE-PASS

Reach **Listening** with **source is live; matching hook is absent**, then provide **source.complete**.

Expect, in order: forward the unchanged notification; release source and invoke configured finalize hook.

Resulting state: Closed after source termination.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-COMPLETE-PASS.

## S20-TAP-CANCEL

Reach **Listening** with **consumer cancels between source notifications**, then provide **cancel**.

Expect, in order: release source.

Resulting state: Closed cancel; no downstream terminal notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-CANCEL.
