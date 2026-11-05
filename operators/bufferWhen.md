# bufferWhen: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Open one buffer immediately; each selected closing notifier next flushes it and starts a fresh buffer.

**Scope:** Observable closing streams; selector called once per buffer. Atomic post-setup notifications; no reentrant notifications or cancellation inside selector, observers or teardown.

**Dataflow shape:** `bufferWhen : T* -> (T*)*`. An initial buffer is opened before source subscription; each closing next emits it, even empty. A fresh closing selector is called for each newly opened buffer. A closing notifier completing without next never closes its buffer; source completion flushes that buffer.

<!-- BUFFERWHEN-INIT -->
No work begins before subscription; bufferToggle subscribes openings first, bufferWhen asks for closing before source.

<!-- BUFFERWHEN-CALLBACK-RETURN -->
The returned closing Observable is subscribed; on bufferWhen setup this happens before source connection.

<!-- BUFFERWHEN-CALLBACK-THROW -->
Selector exceptions error the output and dispose resources; they do not close/flush pending buffers.

<!-- BUFFERWHEN-SOURCE-NEXT -->
Values are opaque; source values belong to all currently open buffers.

<!-- BUFFERWHEN-SOURCE-COMPLETE -->
Completion flushes open buffers, including the one current buffer for bufferWhen.

<!-- BUFFERWHEN-SOURCE-ERROR -->
An error does not emit pending arrays.

<!-- BUFFERWHEN-CANCEL-ACTIVE -->
Cancellation is silent.

<!-- BUFFERWHEN-CANCEL-CALLING -->
Model cancellation is at an explicit checkpoint, not inside executing user selector.

<!-- BUFFERWHEN-CLOSING-NEXT -->
One closing emission flushes the old array and starts selection for the next buffer.

<!-- BUFFERWHEN-CLOSING-COMPLETE -->
Completion without next leaves its buffer for source completion.

<!-- BUFFERWHEN-CLOSING-ERROR -->
Any active closing Observable error terminates the entire result.

**Time:** Time and equal-time order come from externally ordered source/openings/closing notifications. No clock or scheduler is introduced.

**Sharing:** No sharing or replay; each result subscription owns all buffers and closing subscriptions.

**Callbacks:** Selector invocation and return/throw modeled as correlated synchronous microsteps. The pure transition model never executes callbacks.

**Excluded:** Non-Observable ObservableInput conversion (Promises, etc.), arbitrary synchronous/reentrant closing notification during subscription, throwing downstream observers/finalizers. Cancellation inside selector or between output notification and resource release, callback side effects and arbitrary mutation of previously emitted array references. Universal symbolic equivalence beyond the finite scoped protocol.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-08.md) is reported separately from this specification.
