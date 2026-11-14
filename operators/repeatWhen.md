# repeatWhen: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Repeat on source completion, controlled by a single persistent notifier and completion Subject.

**Scope:** One notifier function returning a non-synchronously-emitting Observable; selector called exactly once after first source completion.. Atomic post-subscription notifications; notifier next is only admitted while waiting after a source completion.

**Dataflow shape:** `repeatWhen(completions$ -> notifier$) : Cω(Signal) -> T* -> T*`. Each source next forwards once; a source completion emits one void notification on the completion Subject. Notifier next while waiting starts one new source; notifier completion ends repetition after any active source completes. Source or notifier error terminates immediately. Cancellation silently releases both subscriptions.

<!-- S17-REPEATWHEN-START -->
Notifier selector has not yet been invoked: it is lazy until the first successful source completion.

<!-- S17-REPEATWHEN-VALUE -->
The notifier only governs repetition; values from every successful attempt reach the downstream observer.

<!-- S17-REPEATWHEN-FIRST-SOURCE-COMPLETE -->
On first completion allocate the Subject, invoke the user notifier exactly once and subscribe its result; notify it of the completion.

<!-- S17-REPEATWHEN-SOURCE-COMPLETE-WAIT -->
Subsequent completions reuse the same Subject and notifier subscription, not a fresh notifier selector call.

<!-- S17-REPEATWHEN-SOURCE-COMPLETE-STOP -->
If the notifier has already completed, downstream completes when the current source finally completes.

<!-- S17-REPEATWHEN-RESTART -->
Every notifier next while waiting restarts exactly one new producer execution; notifier connection is retained.

<!-- S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT -->
An empty/finished notifier ends the repetition while waiting; it does not subscribe a new source.

<!-- S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE -->
Notifier completion is recorded. Do not interrupt the current source: completion awaits its own successful termination.

<!-- S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE -->
Notifier error terminates the result whether waiting or inside a restarted source execution.

<!-- S17-REPEATWHEN-CANCEL-ACTIVE -->
Cancellation never sends a synthetic complete or error.

<!-- S17-REPEATWHEN-NOTIFIER-ERROR-WAITING -->
Notifier error terminates the result whether waiting or inside a restarted source execution.

<!-- S17-REPEATWHEN-CANCEL-WAITING -->
Cancellation never sends a synthetic complete or error.

<!-- S17-REPEATWHEN-SOURCE-ERROR -->
repeatWhen observes successful completion only; a source error never triggers its notifier.

**Time:** Source notifications and notifier next/complete/error carry their own times; no new clock is introduced.

**Sharing:** The completion Subject is internal to one result subscription; it is not multicast among downstream subscribers.

**Callbacks:** Notifier selector is represented by its successful Observable result; callback throws/invalid inputs are excluded.

**Excluded:** Synchronous notifier next or complete during its original subscription, source subscription setup recursion and syncResub flag mechanics. Notifier next while a source is already active (can start overlapping source executions), Promise inputs and arbitrary reentrancy. Notifier selector throws, teardown throws and notifier emissions following terminal notification.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-17.md) is reported separately from this specification.
