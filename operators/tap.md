# tap: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Observe source notifications and connection lifecycle without replacing successful values.

**Scope:** A subset of the six named observer hooks; next-function form is the next-only profile.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `tap : Cω(ObserverHooks) → T* → T*`. Successful notification hooks preserve original payload identity and notification order. A thrown notification-hook value replaces that notification with an error. unsubscribe hooks run on cancellation or next-handler failure, not normal source error/complete; finalize runs on all acquired-source termination paths.

<!-- S20-TAP-START -->
The lifecycle hook runs before source acquisition. Neither runs during operator construction.

<!-- S20-TAP-NEXT-CALL -->
The source notification is not forwarded until its handler returns successfully.

<!-- S20-TAP-NEXT-RETURN -->
Handler return values are ignored: tap is not map. Terminal callbacks clear the internal unsubscription flag before being called.

<!-- S20-TAP-NEXT-THROW -->
A next-handler throw terminates by unsubscription, so unsubscribe precedes finalize.

<!-- S20-TAP-ERROR-CALL -->
The source notification is not forwarded until its handler returns successfully.

<!-- S20-TAP-ERROR-RETURN -->
Handler return values are ignored: tap is not map. Terminal callbacks clear the internal unsubscription flag before being called.

<!-- S20-TAP-ERROR-THROW -->
A terminal-handler throw replaces the terminal notification but does not invoke unsubscribe: the terminal flag was already cleared.

<!-- S20-TAP-COMPLETE-CALL -->
The source notification is not forwarded until its handler returns successfully.

<!-- S20-TAP-COMPLETE-RETURN -->
Handler return values are ignored: tap is not map. Terminal callbacks clear the internal unsubscription flag before being called.

<!-- S20-TAP-COMPLETE-THROW -->
A terminal-handler throw replaces the terminal notification but does not invoke unsubscribe: the terminal flag was already cleared.

<!-- S20-TAP-CANCEL -->
Cancellation and normal source termination have different lifecycle hook policies.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** next/error/complete invocation outcomes are explicit correlated events. subscribe/unsubscribe/finalize are nonthrowing observation actions; their return values have no effect.

**Excluded:** Throwing lifecycle hooks (subscribe/unsubscribe/finalize), deprecated positional overload parsing and JavaScript receiver binding. Payload mutation is not simulated: reference identity is preserved, not a deep snapshot. Source delivery during acquisition and observer-triggered cancellation during a pending callback. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-20-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-20.md) is reported separately from this specification.
