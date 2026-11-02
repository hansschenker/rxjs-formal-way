# skipUntil: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Drop source values until the first notifier value permanently opens the gate.

**Scope:** A valid Observable notifier; one source and one notifier occurrence per result subscription. Non-reentrant post-setup notifications plus explicitly modeled synchronous notifier initialization. Arbitrary nested delivery and cancellation within setup remain excluded.

**Dataflow shape:** `skipUntil : U* -> T* -> T*`. Forward a suffix beginning after the notifier signal; skipped source values are not buffered. Notifier values never become output values. Every next is a signal, including undefined, false and null. Completion without next is not a signal. The shape counts values, not notifications, subscriptions or setup continuation steps.

<!-- SKIPUNTIL-INIT -->
skipUntil subscribes to the notifier before attempting the source subscription. Construction alone acquires neither subscription.

<!-- SKIPUNTIL-SOURCE-CONNECT -->
After notifier setup returns, an unterminated result connects to the source using the gate state established by any synchronous notifier notifications.

<!-- SKIPUNTIL-SETUP-NOTIFIER-NEXT -->
The first notifier value releases the notifier and permanently opens the gate. It emits no source value and does not replay previously skipped values.

<!-- SKIPUNTIL-SETUP-NOTIFIER-COMPLETE -->
Notifier completion without a value does not open skipUntil. Source values continue to be skipped until the source itself terminates or downstream cancels.

<!-- SKIPUNTIL-SETUP-NOTIFIER-ERROR -->
A synchronous notifier error stops downstream. RxJS 7.8.2 skipUntil nevertheless continues to source.subscribe with an already-closed subscriber after notifier setup returns.

<!-- SKIPUNTIL-LIVE-NOTIFIER-NEXT -->
The first notifier value releases the notifier and permanently opens the gate. It emits no source value and does not replay previously skipped values.

<!-- SKIPUNTIL-LIVE-NOTIFIER-COMPLETE -->
Notifier completion without a value does not open skipUntil. Source values continue to be skipped until the source itself terminates or downstream cancels.

<!-- SKIPUNTIL-LIVE-NOTIFIER-ERROR -->
A notifier error is forwarded unchanged and releases the owned subscriptions.

<!-- SKIPUNTIL-CLOSED-SOURCE-ATTEMPT -->
Because skipUntil has no closed check before source.subscribe, a source initializer can still run with subscriber.closed already true. Any returned teardown is immediately disposed and no downstream value or second terminal notification is allowed.

<!-- SKIPUNTIL-DROP -->
With the gate closed, source values are dropped without buffering. A later notifier signal does not recover them.

<!-- SKIPUNTIL-PASS -->
With the gate open, source values are forwarded unchanged.

<!-- SKIPUNTIL-SOURCE-COMPLETE -->
Source completion completes downstream even while the skipUntil gate is closed. It releases the notifier if still live, then the source.

<!-- SKIPUNTIL-SOURCE-ERROR -->
A source error is forwarded even while the skipUntil gate is closed, then releases both owned subscriptions.

<!-- SKIPUNTIL-CANCEL -->
Cancellation releases the live notifier, if any, and the source, without sending completion.

**Time:** Source and notifier supply time and ordering. No timer is introduced. Setup and synchronous notifier delivery occur at the subscription timestamp; equal-time inputs retain sequence order.

**Sharing:** No sharing introduced. Each result subscription owns its gate and source/notifier subscriptions; either producer may independently be hot or shared.

**Callbacks:** No user predicate. setup.ready is an environment continuation marking return from notifier subscription, not a user callback or scheduler turn.

**Excluded:** Non-Observable ObservableInput conversion, throwing observers/finalizers, arbitrary reentry and producer-abort guarantees. Source synchronous delivery/finalizer-registration order is characterized separately from exact post-setup action traces. subscribe/unsubscribe actions describe subscription lifecycle; an already-closed source attempt is not a live source connection.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-05.md) is reported separately from this specification.
