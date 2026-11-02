# takeUntil: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward source values until the first notifier value completes the result.

**Scope:** A valid Observable notifier; one source and one notifier occurrence per result subscription. Non-reentrant post-setup notifications plus explicitly modeled synchronous notifier initialization. Arbitrary nested delivery and cancellation within setup remain excluded.

**Dataflow shape:** `takeUntil : U* -> T* -> T*`. Forward a prefix of source values before the notifier signal or another terminating event. Notifier values never become output values. Every next is a signal, including undefined, false and null. Completion without next is not a signal. The shape counts values, not notifications, subscriptions or setup continuation steps.

<!-- TAKEUNTIL-INIT -->
takeUntil subscribes to the notifier before attempting the source subscription. Construction alone acquires neither subscription.

<!-- TAKEUNTIL-SOURCE-CONNECT -->
After notifier setup returns, an unterminated result connects to the source using the gate state established by any synchronous notifier notifications.

<!-- TAKEUNTIL-SETUP-NOTIFIER-NEXT -->
Any notifier value completes the result before the source is subscribed. The notifier payload is not emitted.

<!-- TAKEUNTIL-SETUP-NOTIFIER-COMPLETE -->
Notifier completion without a value does not stop takeUntil. The notifier is released and source values may continue.

<!-- TAKEUNTIL-SETUP-NOTIFIER-ERROR -->
A notifier error is forwarded unchanged and releases the owned subscriptions, without acquiring the source.

<!-- TAKEUNTIL-LIVE-NOTIFIER-NEXT -->
Any notifier value completes the result and releases notifier then source. The notifier payload is not emitted.

<!-- TAKEUNTIL-LIVE-NOTIFIER-COMPLETE -->
Notifier completion without a value does not stop takeUntil. The notifier is released and source values may continue.

<!-- TAKEUNTIL-LIVE-NOTIFIER-ERROR -->
A notifier error is forwarded unchanged and releases the owned subscriptions.

<!-- TAKEUNTIL-PASS -->
With the gate open, source values are forwarded unchanged.

<!-- TAKEUNTIL-SOURCE-COMPLETE -->
Source completion completes downstream even while the skipUntil gate is closed. It releases the notifier if still live, then the source.

<!-- TAKEUNTIL-SOURCE-ERROR -->
A source error is forwarded even while the skipUntil gate is closed, then releases both owned subscriptions.

<!-- TAKEUNTIL-CANCEL -->
Cancellation releases the live notifier, if any, and the source, without sending completion.

**Time:** Source and notifier supply time and ordering. No timer is introduced. Setup and synchronous notifier delivery occur at the subscription timestamp; equal-time inputs retain sequence order.

**Sharing:** No sharing introduced. Each result subscription owns its gate and source/notifier subscriptions; either producer may independently be hot or shared.

**Callbacks:** No user predicate. setup.ready is an environment continuation marking return from notifier subscription, not a user callback or scheduler turn.

**Excluded:** Non-Observable ObservableInput conversion, throwing observers/finalizers, arbitrary reentry and producer-abort guarantees. Source synchronous delivery/finalizer-registration order is characterized separately from exact post-setup action traces. subscribe/unsubscribe actions describe subscription lifecycle; an already-closed source attempt is not a live source connection.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-05.md) is reported separately from this specification.
