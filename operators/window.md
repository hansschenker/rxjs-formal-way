# window: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit an initial live window and rotate it on boundary next; route source values into the current multicast window.

**Scope:** Valid Observable boundary input; observers use only the Observable-facing interface of emitted handles.. Atomic non-reentrant reactions after source/boundary setup returns. Consumer attachment is an explicit event between reactions; synchronous setup and callback-driven reentry are characterized separately.

**Dataflow shape:** `window : Cω(BoundarySignal) → T* → Observable<T>*`. One initial handle is emitted on result connection, followed by one handle for every accepted boundary next. Each window exposes only source values observed while it is current and that consumer is attached. Boundary complete does not complete the result; outer cancellation does not complete its current window consumers.

<!-- S21-WINDOW-START -->
The initial window precedes either input subscription. Subsequent modeled events begin after setup returns.

<!-- S21-WINDOW-SOURCE-NEXT -->
A window is a live multicast stream. Source values sent before an observer attaches are not replayed.

<!-- S21-WINDOW-BOUNDARY-NEXT -->
Every boundary next rotates the window, even if no source value arrived. Boundary payloads are ignored.

<!-- S21-WINDOW-BOUNDARY-COMPLETE -->
Boundary completion is a no-op for window/result notifications. It does not close the current window.

<!-- S21-WINDOW-SOURCE-COMPLETE -->
Current-window completion precedes outer completion. Final operator teardown unsubscribes the current Subject itself.

<!-- S21-WINDOW-SOURCE-ERROR -->
Both input failures reach current-window consumers before the outer observer. The error payload is never replaced.

<!-- S21-WINDOW-BOUNDARY-ERROR -->
Both input failures reach current-window consumers before the outer observer. The error payload is never replaced.

<!-- S21-WINDOW-CANCEL -->
Subject.unsubscribe is not Subject.complete. Window consumers do not hold a lease that preserves the original source.

<!-- S21-WINDOW-OBSERVER-LIVE -->
Attaching a window observer does not acquire another source or boundary subscription.

<!-- S21-WINDOW-OBSERVER-COMPLETE-ACTIVE -->
Retired completed windows remember completion but never replay values. The final current handle is separately invalidated and excluded from this legal event.

<!-- S21-WINDOW-OBSERVER-UNSUBSCRIBE-ACTIVE -->
Consumer cancellation is local to that window observer; it never closes the shared window or outer source.

<!-- S21-WINDOW-OBSERVER-COMPLETE-STOPPED -->
Retired completed windows remember completion but never replay values. The final current handle is separately invalidated and excluded from this legal event.

<!-- S21-WINDOW-OBSERVER-UNSUBSCRIBE-STOPPED -->
An outer-cancelled Subject leaves already attached Subscription objects open until consumers close them.

**Time:** Source, boundary and consumer events supply trace time. Equal-time order is explicit input order; no clock, buffer or scheduler is introduced.

**Sharing:** Each result subscription owns its own source/boundary subscriptions and windows. Each emitted window is live multicast without replay; its consumers never retain the original source after outer cancellation.

**Callbacks:** No user callback; payloads and boundary notification values are opaque.

**Excluded:** Promise/Iterable or invalid boundary conversion. Synchronous source/boundary notifications during setup and consumer attachment/cancellation inside an action word. Imperative next/error/complete access on the later Subject objects; the model specifies their Observable-facing behavior. Subscription to the invalidated final current handle is outside the modeled legal alphabet; native tests separately verify ObjectUnsubscribedError. Physical Subject/Observable prototype identity and observer-thrown errors. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-21-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-21.md) is reported separately from this specification.
