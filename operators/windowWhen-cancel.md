# windowWhen: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Route values through successive live windows; each fresh closing signal ends the current window on next or complete.

**Scope:** No numeric parameters. A synchronous closing factory returns a valid Observable whose acquisition is non-notifying, or throws an opaque error.. Atomic non-reentrant reactions; child attachment occurs between completed reactions. Source and closing acquisition do not synchronously notify.

**Dataflow shape:** `windowWhen : (() → U*) → T* → (T*)*`. One initial window plus one successor for each admitted closing next or completion. Only current-window consumers receive source values; windows and values are not replayed. Source completion/error ends current children before outer; outer cancellation leaves orphaned child Subjects.

<!-- S22-WINDOWWHEN-START -->
The initial handle and closing selector precede source acquisition. Construction itself does no work.

<!-- S22-WINDOWWHEN-FACTORY-RETURN -->
A valid returned Observable is abstracted by its subscription occurrence, regardless of producer identity.

<!-- S22-WINDOWWHEN-FACTORY-THROW -->
Initial selector failure still reaches source.subscribe with an already closed subscriber. This non-notifying setup attempt acquires and immediately releases the source.

<!-- S22-WINDOWWHEN-SOURCE-NEXT -->
Late observers miss earlier values. The outer sequence contains window handles, not source payloads.

<!-- S22-WINDOWWHEN-CLOSING-NEXT -->
Both next and empty completion rotate. Unsubscribing the old closer precedes child completion and replacement factory invocation.

<!-- S22-WINDOWWHEN-CLOSING-COMPLETE -->
Both next and empty completion rotate. Unsubscribing the old closer precedes child completion and replacement factory invocation.

<!-- S22-WINDOWWHEN-SOURCE-COMPLETE -->
Initial closing teardown precedes source; after a rotation, source teardown precedes the replacement closer.

<!-- S22-WINDOWWHEN-SOURCE-ERROR -->
Closing failure terminates the outer execution; it does not rotate or invoke the factory again.

<!-- S22-WINDOWWHEN-CLOSING-ERROR -->
Closing failure terminates the outer execution; it does not rotate or invoke the factory again.

<!-- S22-WINDOWWHEN-CANCEL -->
windowWhen finalization drops its reference without completing or unsubscribing the window Subject. Late observers can still attach without receiving values.

<!-- S22-WINDOWWHEN-OBSERVE-OPEN-ACTIVE -->
Retained handles remain observable after outer termination; they do not keep the original source connected.

<!-- S22-WINDOWWHEN-OBSERVE-COMPLETE-ACTIVE -->
Retained handles remain observable after outer termination; they do not keep the original source connected.

<!-- S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-ACTIVE -->
Orphaned consumers can unsubscribe after outer cancellation.

<!-- S22-WINDOWWHEN-OBSERVE-OPEN-STOPPED -->
Retained handles remain observable after outer termination; they do not keep the original source connected.

<!-- S22-WINDOWWHEN-OBSERVE-COMPLETE-STOPPED -->
Retained handles remain observable after outer termination; they do not keep the original source connected.

<!-- S22-WINDOWWHEN-OBSERVE-ERROR-STOPPED -->
Retained handles remain observable after outer termination; they do not keep the original source connected.

<!-- S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-STOPPED -->
Orphaned consumers can unsubscribe after outer cancellation.

**Time:** No timer is introduced. Source and closing streams provide notification times. Equal-time ordering is explicit; runWindowWhenTrace enforces same-time factory outcomes.

**Sharing:** Independent outer subscriptions have separate windows and closing occurrences. Inner windows are live multicast without replay; inner consumers hold no upstream lease.

**Callbacks:** Factory requests have generation equal to the new window identity. Explicit return/throw must match the current invocation at the same envelope time.

**Excluded:** Synchronous closing notifications during subscription, recursively empty closing streams, and reentrant factory/observer/source setup. Child attachment during the synchronous handle-announcement/factory reaction; native tests characterize this separately. ObservableInput conversion beyond valid Observable values, imperative Subject mutation and source setup that emits despite a closed subscriber. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-22-WHEN-WINDOWS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-22.md) is reported separately from this specification.
