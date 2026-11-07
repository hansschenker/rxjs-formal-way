# connect: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Establish two downstream branches before connecting one shared, possibly synchronous source.

**Scope:** Default Subject connector; selector specifically merge(shared$, shared$). No custom SubjectLike or arbitrary selected graph.. Synchronous source notifications after completed selector setup are supported; arbitrary selector reentry and synchronous selected-result termination are excluded.

**Dataflow shape:** `connect(merge(shared,shared)) : T* -> (T + T)*`. Each source next is delivered twice in selected branch order after one source subscription. The selected result is subscribed before the original source starts. Every result subscription owns a new connector Subject; connect does not automatically share separate outer subscriptions.

<!-- CONNECT-INIT -->
A fresh Subject is allocated per subscription, followed by synchronous selector invocation.

<!-- CONNECT-SELECTOR-READY -->
Both selected branches listen to the multicast Subject before a synchronous source can emit.

<!-- CONNECT-SELECTOR-THROW -->
No source is connected when selector construction fails.

<!-- CONNECT-BROADCAST -->
Both branches receive the same object without cloning; selector merge emits two output notifications.

<!-- CONNECT-COMPLETE -->
Completion propagates through the configured selected stream, not as a second output completion.

<!-- CONNECT-ERROR -->
The original error identity is preserved; no values are emitted after termination.

<!-- CONNECT-CANCEL -->
Explicit cancellation stops the one source and both selected consumers silently.

**Time:** No scheduler or timer. Source dictates the timing; one source next causes two same-moment selected outputs.

**Sharing:** Subject multicasts inside one result subscription; two selected branches observe one source. Separate outer subscriptions do not share.

**Callbacks:** Selector construction modeled as a synchronous correlated callback; no source side effect before selected subscription.

**Excluded:** Custom connector, selector returning Promise/iterable, arbitrary selector topology or early selected-result termination. Observer exceptions/reentrancy, finalizer throws and cancellation during synchronous observer notification.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-10.md) is reported separately from this specification.
