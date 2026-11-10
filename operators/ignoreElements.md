# ignoreElements: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Suppress all next payloads, forwarding only the terminal source protocol.

**Scope:** No arguments.. Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Dataflow shape:** `ignoreElements : T* -> ∅*`. Exactly zero output next notifications for all source histories. Normal completion/error follows upstream; cancellation is silent. Cω describes next cardinality. Error, complete, cancellation, and resource release are separate events.

<!-- S13-IGNOREELEMENTS-INIT -->
Producer starts only when consumed.

<!-- S13-IGNOREELEMENTS-DROP -->
Discard opaque payload but retain source connection.

<!-- S13-IGNOREELEMENTS-COMPLETE -->
Completion is a protocol signal, never a value.

<!-- S13-IGNOREELEMENTS-ERROR -->
Errors are not dropped by ignoreElements.

<!-- S13-IGNOREELEMENTS-CANCEL -->
Never synthesize terminal notifications.

**Time:** No timer/scheduler; terminal time is the upstream terminal time.

**Sharing:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Callbacks:** No callbacks.

**Excluded:** Reentrant source/observer delivery and throwing downstream handlers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-13.md) is reported separately from this specification.
