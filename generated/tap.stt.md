# tap-subscribe-next-error-complete-unsubscribe-finalize: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-TAP-START | Unsubscribed | subscribe | first consumer connection | invoke nonthrowing subscribe hook; subscribe source | Listening with next notification invocation index zero. | S20-TAP-START |
| S20-TAP-NEXT-CALL | Listening | source.next | source is live; matching hook is configured | invoke the matching hook with the source notification payload | Calling next with the original notification retained; only its correlated outcome is legal. | S20-TAP-NEXT-CALL |
| S20-TAP-NEXT-RETURN | Calling | callback.return | return matches the pending next invocation | forward the exact original value | Listening; advance invocation index and clear pending notification. | S20-TAP-NEXT-RETURN |
| S20-TAP-NEXT-THROW | Calling | callback.throw | throw matches the pending next invocation | error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing unsubscribe hook; invoke nonthrowing finalize hook | Closed error; discard pending notification. | S20-TAP-NEXT-THROW |
| S20-TAP-ERROR-CALL | Listening | source.error | source is live; matching hook is configured | invoke the matching hook with the source notification payload | Calling error with the original notification retained; only its correlated outcome is legal. | S20-TAP-ERROR-CALL |
| S20-TAP-ERROR-RETURN | Calling | callback.return | return matches the pending error invocation | forward original terminal notification; release source; invoke nonthrowing finalize hook | Closed error; no unsubscribe hook on source termination. | S20-TAP-ERROR-RETURN |
| S20-TAP-ERROR-THROW | Calling | callback.throw | throw matches the pending error invocation | error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing finalize hook | Closed error; discard pending notification. | S20-TAP-ERROR-THROW |
| S20-TAP-COMPLETE-CALL | Listening | source.complete | source is live; matching hook is configured | invoke the matching hook with the source notification payload | Calling complete with the original notification retained; only its correlated outcome is legal. | S20-TAP-COMPLETE-CALL |
| S20-TAP-COMPLETE-RETURN | Calling | callback.return | return matches the pending complete invocation | forward original terminal notification; release source; invoke nonthrowing finalize hook | Closed complete; no unsubscribe hook on source termination. | S20-TAP-COMPLETE-RETURN |
| S20-TAP-COMPLETE-THROW | Calling | callback.throw | throw matches the pending complete invocation | error with the exact thrown value instead of the pending notification; release source; invoke nonthrowing finalize hook | Closed error; discard pending notification. | S20-TAP-COMPLETE-THROW |
| S20-TAP-CANCEL | Listening | cancel | consumer cancels between source notifications | release source; invoke nonthrowing unsubscribe hook; invoke nonthrowing finalize hook | Closed cancel; no downstream terminal notification. | S20-TAP-CANCEL |
