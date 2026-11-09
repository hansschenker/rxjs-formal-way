# finalize: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Mirror the source exactly and invoke a zero-argument teardown callback once on complete, error, or explicit unsubscribe.

**Scope:** One zero-argument callback; no other options.. The pure model treats finalizer invocation as an atomic teardown action and excludes callback reentry/throws.

**Dataflow shape:** `finalize : (() -> Unit) -> T* -> T*`. All next values and terminal notifications retain source identity/order. The callback itself contributes no stream value and its return value is ignored. Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.

<!-- FINALIZE-INIT -->
The finalizer is registered for this result subscription.

<!-- FINALIZE-PASS -->
finalize never transforms next values.

<!-- FINALIZE-COMPLETE -->
The callback runs as teardown after terminal notification.

<!-- FINALIZE-ERROR -->
Error identity is preserved; the finalizer still runs.

<!-- FINALIZE-CANCEL -->
Explicit cancellation is silent downstream but still executes the finalizer.

**Time:** No scheduler or timer. Finalization is part of subscription teardown ordering.

**Sharing:** No sharing is introduced; each result subscription owns independent state and resources.

**Callbacks:** The finalizer is represented as an invoke-callback action with no meaningful input value; callback return is not a stream event.

**Excluded:** Throwing finalizer behavior, nested unsubscription from observer handlers, deprecated synchronous error handling details.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-12.md) is reported separately from this specification.
