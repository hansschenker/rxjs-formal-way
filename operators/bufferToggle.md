# bufferToggle: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Open possibly overlapping buffers for each openings value; each selected closing notifier next releases only its own buffer.

**Scope:** Observable openings and Observable closing streams. Atomic post-setup notifications; no reentrant notifications or cancellation inside selector, observers or teardown.

**Dataflow shape:** `bufferToggle : O* × T* -> (T*)*`. No openings implies no buffers or values; one source item can appear in multiple overlapping buffers. A closing notifier next emits one array, including an empty array; closing completion does not flush. Source completion flushes every still-open buffer in opening order, then completes.

<!-- BUFFERTOGGLE-INIT -->
No work begins before subscription; bufferToggle subscribes openings first, bufferWhen asks for closing before source.

<!-- BUFFERTOGGLE-CALLBACK-RETURN -->
The returned closing Observable is subscribed; on bufferWhen setup this happens before source connection.

<!-- BUFFERTOGGLE-CALLBACK-THROW -->
Selector exceptions error the output and dispose resources; they do not close/flush pending buffers.

<!-- BUFFERTOGGLE-SOURCE-NEXT -->
Values are opaque; source values belong to all currently open buffers.

<!-- BUFFERTOGGLE-SOURCE-COMPLETE -->
Completion flushes open buffers, including the one current buffer for bufferWhen.

<!-- BUFFERTOGGLE-SOURCE-ERROR -->
An error does not emit pending arrays.

<!-- BUFFERTOGGLE-CANCEL-ACTIVE -->
Cancellation is silent.

<!-- BUFFERTOGGLE-CANCEL-CALLING -->
Model cancellation is at an explicit checkpoint, not inside executing user selector.

<!-- BUFFERTOGGLE-CLOSING-NEXT -->
A closing emission affects only the buffer associated with that subscription.

<!-- BUFFERTOGGLE-CLOSING-COMPLETE -->
Completion without next leaves its buffer for source completion.

<!-- BUFFERTOGGLE-CLOSING-ERROR -->
Any active closing Observable error terminates the entire result.

<!-- BUFFERTOGGLE-OPENINGS-NEXT -->
Every opening starts an independent buffer. Its value is passed to the closing selector, not downstream.

<!-- BUFFERTOGGLE-OPENINGS-COMPLETE -->
Openings completion stops new buffers but does not close existing buffers or the source.

<!-- BUFFERTOGGLE-OPENINGS-ERROR -->
Openings errors propagate without emitting buffered values.

**Time:** Time and equal-time order come from externally ordered source/openings/closing notifications. No clock or scheduler is introduced.

**Sharing:** No sharing or replay; each result subscription owns all buffers and closing subscriptions.

**Callbacks:** Selector invocation and return/throw modeled as correlated synchronous microsteps. The pure transition model never executes callbacks.

**Excluded:** Non-Observable ObservableInput conversion (Promises, etc.), arbitrary synchronous/reentrant closing notification during subscription, throwing downstream observers/finalizers. Cancellation inside selector or between output notification and resource release, callback side effects and arbitrary mutation of previously emitted array references. Universal symbolic equivalence beyond the finite scoped protocol.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-08.md) is reported separately from this specification.
