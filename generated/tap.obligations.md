# tap-subscribe-next-error-complete-unsubscribe-finalize: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-TAP-START

Reach **Unsubscribed** with **first consumer connection**, then provide **subscribe**.

Expect, in order: invoke nonthrowing subscribe hook; subscribe source.

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

Expect, in order: error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing unsubscribe hook; invoke nonthrowing finalize hook.

Resulting state: Closed error; discard pending notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-NEXT-THROW.

## S20-TAP-ERROR-CALL

Reach **Listening** with **source is live; matching hook is configured**, then provide **source.error**.

Expect, in order: invoke the matching hook with the source notification payload.

Resulting state: Calling error with the original notification retained; only its correlated outcome is legal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-ERROR-CALL.

## S20-TAP-ERROR-RETURN

Reach **Calling** with **return matches the pending error invocation**, then provide **callback.return**.

Expect, in order: forward original terminal notification; release source; invoke nonthrowing finalize hook.

Resulting state: Closed error; no unsubscribe hook on source termination.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-ERROR-RETURN.

## S20-TAP-ERROR-THROW

Reach **Calling** with **throw matches the pending error invocation**, then provide **callback.throw**.

Expect, in order: error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing finalize hook.

Resulting state: Closed error; discard pending notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-ERROR-THROW.

## S20-TAP-COMPLETE-CALL

Reach **Listening** with **source is live; matching hook is configured**, then provide **source.complete**.

Expect, in order: invoke the matching hook with the source notification payload.

Resulting state: Calling complete with the original notification retained; only its correlated outcome is legal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-COMPLETE-CALL.

## S20-TAP-COMPLETE-RETURN

Reach **Calling** with **return matches the pending complete invocation**, then provide **callback.return**.

Expect, in order: forward original terminal notification; release source; invoke nonthrowing finalize hook.

Resulting state: Closed complete; no unsubscribe hook on source termination.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-COMPLETE-RETURN.

## S20-TAP-COMPLETE-THROW

Reach **Calling** with **throw matches the pending complete invocation**, then provide **callback.throw**.

Expect, in order: error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing finalize hook.

Resulting state: Closed error; discard pending notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-COMPLETE-THROW.

## S20-TAP-CANCEL

Reach **Listening** with **consumer cancels between source notifications**, then provide **cancel**.

Expect, in order: release source; invoke nonthrowing unsubscribe hook; invoke nonthrowing finalize hook.

Resulting state: Closed cancel; no downstream terminal notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAP-CANCEL.
