# multicast: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Deprecated multicast(() => new Subject(), selector) with two branches set up before connecting one original source.

**Scope:** Deprecated subjectFactory plus selector overload. Factory returns fresh plain Subject; selector merges shared$ twice.. Synchronous source notifications after completed selector setup are supported; arbitrary selector reentry and synchronous selected-result termination are excluded.

**Dataflow shape:** `multicast(SubjectFactory, merge(shared$,shared$)) : T* → (T + T)*`. One source subscription per selected-result subscription, despite two consumers of the shared Subject. The selected output is subscribed before the source is acquired, including synchronous producers. A factory creates a fresh Subject for every output subscription; a fixed Subject instance has different reuse semantics and is out of scope.

<!-- S15-MULTICAST-INIT -->
A fresh Subject is allocated per subscription, followed by synchronous selector invocation.

<!-- S15-MULTICAST-SELECTOR-READY -->
Both selected branches listen to the multicast Subject before a synchronous source can emit.

<!-- S15-MULTICAST-SELECTOR-THROW -->
No source is connected when selector construction fails.

<!-- S15-MULTICAST-BROADCAST -->
Both branches receive the same object without cloning; selector merge emits two output notifications.

<!-- S15-MULTICAST-COMPLETE -->
Completion propagates through the configured selected stream, not as a second output completion.

<!-- S15-MULTICAST-ERROR -->
The original error identity is preserved; no values are emitted after termination.

<!-- S15-MULTICAST-CANCEL -->
Explicit cancellation stops the one source and both selected consumers silently.

**Time:** No scheduler or timer. Source dictates the timing; one source next causes two same-moment selected outputs.

**Sharing:** Within one selected-result subscription, one Subject multicasts a single source connection to two selected branches. Separate result subscriptions get separate Subjects.

**Callbacks:** Selector construction modeled as a synchronous correlated callback; no source side effect before selected subscription.

**Excluded:** Subject instance reuse, selector-less ConnectableObservable.connect/refCount, ReplaySubject/BehaviorSubject/AsyncSubject, custom connector and arbitrary selectors. Synchronous selected-result early termination, observer reentrancy and throwing finalizers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-15.md) is reported separately from this specification.
