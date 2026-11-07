# debounce: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Keep only the latest source value and release it on the current duration next, or flush on source completion.

**Scope:** Duration selectors returning an Observable; no Promise or other ObservableInput conversion.. Atomic non-reentrant selector outcomes; reentrant source and observer delivery excluded.

**Dataflow shape:** `debounce : T* × (T -> Duration*) -> T*`. Every source.next replaces the pending value and its duration subscription. Duration next emits latest once; duration complete without next does not emit. Source complete flushes pending; error and cancellation never flush.

<!-- DEBOUNCE-INIT -->
No duration selector is called before the first source value.

<!-- DEBOUNCE-NEW-VALUE -->
A new source value suppresses the previous pending value; only a new duration may release it.

<!-- DEBOUNCE-DURATION-RETURN -->
The callback returns an Observable; no duration values have been delivered yet.

<!-- DEBOUNCE-DURATION-THROW -->
A failing selector terminates the dataflow.

<!-- DEBOUNCE-DURATION-NEXT -->
Only a next from the currently selected duration releases the latest value.

<!-- DEBOUNCE-DURATION-EMPTY -->
Duration completion alone never emits; source completion can still flush this value.

<!-- DEBOUNCE-DURATION-ERROR -->
Duration error discards the latest cached value.

<!-- DEBOUNCE-SOURCE-COMPLETE -->
Source completion flushes the most recent value even after a duration completed silently.

<!-- DEBOUNCE-SOURCE-ERROR-ACTIVE -->
An error never flushes pending debounced values.

<!-- DEBOUNCE-CANCEL-ACTIVE -->
Unsubscription is not completion.

<!-- DEBOUNCE-SOURCE-ERROR-CALLING -->
An error never flushes pending debounced values.

<!-- DEBOUNCE-CANCEL-CALLING -->
Unsubscription is not completion.

**Time:** Duration Observable controls delivery; no clock or timer is created by debounce itself.

**Sharing:** No sharing or replay; own latest value and one live duration per output subscriber.

**Callbacks:** One synchronous selector invocation per source next; callback outcome modeled as a separate correlated event.

**Excluded:** Promise/iterable duration, selector reentry, throwing observers/finalizers, cancellation during nested callback execution.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-10.md) is reported separately from this specification.
