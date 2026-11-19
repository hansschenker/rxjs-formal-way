# windowCount: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Rotate count-limited live multicast windows with overlapping, contiguous and gapped source-index policies.

**Scope:** Positive safe integer windowSize, positive safe integer effective stride (zero argument normalized to windowSize); no count overflow.. Atomic post-setup source notifications, with child attachment between reactions. Synchronous producer/reentrant observer mutation excluded.

**Dataflow shape:** `windowCount : (windowSize:Count,startEvery:Count) → T* → Observable<T>*`. Exactly one initial window handle plus one handle after every startEvery source values; handles can be empty. Every source value is sent to all currently open windows; the oldest closes when its configured count is reached. For startEvery < windowSize windows overlap; for equality they are adjacent; for startEvery > windowSize gaps occur. Source completion closes remaining windows before outer complete; source error errors them before outer error.

<!-- S22-WINDOWCOUNT-START -->
Construction is inert. Initial handle is emitted before the source subscription, enabling immediate child attachment.

<!-- S22-WINDOWCOUNT-NEXT -->
RxJS 7.8.2 closes when (old count - windowSize + 1) is a nonnegative stride multiple. A new handle opens AFTER the value at each stride boundary, possibly empty at completion.

<!-- S22-WINDOWCOUNT-SOURCE-COMPLETE -->
Completion does not emit another window. It completes even the empty window opened on the last source next.

<!-- S22-WINDOWCOUNT-SOURCE-ERROR -->
No replacement error or buffer flush; notification order is each child then the outer subscriber.

<!-- S22-WINDOWCOUNT-CANCEL -->
windowCount finalization clears its internal array but does not complete, error, or unsubscribe its Subject windows. Late window observers can still attach to these silent Subjects.

<!-- S22-WINDOWCOUNT-OBSERVE-OPEN-ACTIVE -->
Each window is a multicast Subject exposed as an Observable; consumers hold no upstream lease.

<!-- S22-WINDOWCOUNT-OBSERVE-COMPLETE-ACTIVE -->
Historical completed windows retain the completion notification even after the outer source has stopped.

<!-- S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-ACTIVE -->
After outer cancellation, orphaned window observers can still unsubscribe independently.

<!-- S22-WINDOWCOUNT-OBSERVE-OPEN-STOPPED -->
Each window is a multicast Subject exposed as an Observable; consumers hold no upstream lease.

<!-- S22-WINDOWCOUNT-OBSERVE-COMPLETE-STOPPED -->
Historical completed windows retain the completion notification even after the outer source has stopped.

<!-- S22-WINDOWCOUNT-OBSERVE-ERROR-STOPPED -->
A Subject retains its terminal failure for late observers, distinct from cancellation.

<!-- S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-STOPPED -->
After outer cancellation, orphaned window observers can still unsubscribe independently.

**Time:** Only source event order controls windows; no scheduler is introduced. Explicit event sequence resolves equal-time input order.

**Sharing:** Result subscriptions are cold and independent. Each inner window is live multicast, no replay; window consumers do not keep the source connected.

**Callbacks:** No callback. Source values are opaque, retain identity, and are never buffered by this operator.

**Excluded:** Fractional, negative, non-finite or overflowing window size/stride/count; zero windowSize. Synchronous source notifications during initial subscription setup and reentrant window-consumer callbacks. Imperative access to Subject implementation, throwing observer teardowns and unmodeled foreign ObservableInput conversions. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-22-COUNT-WINDOWS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-22.md) is reported separately from this specification.
