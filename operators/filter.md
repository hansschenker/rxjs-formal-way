# filter: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward the original incoming value only when the supplied predicate returns a truthy result.

**Scope:** A named callback binding; nonnegative safe-integer callback indices below overflow. Non-reentrant source, callback and observer behavior; cancellation only between fully resolved value reactions.

**Dataflow shape:** `filter : (T! x Index! -> Boolean!) -> T* -> T*`. Zero or one output per predicate result; dropped values still consume an input index. Signatures describe successful value flow, not guarantees against errors or cancellation. The full callback receives a zero-based source-notification index. Filter runtime truthiness is modeled even though its usual TypeScript predicate returns boolean.

<!-- FILTER-INIT -->
Subscribing to filter connects to the source and starts a fresh callback index at zero. Constructing the pipeline does not invoke the callback.

<!-- FILTER-CALL -->
Each incoming value invokes the supplied function once with that value and its zero-based source index. The index advances for every invocation, independently of whether a value is subsequently forwarded.

<!-- FILTER-PASS -->
When the predicate returns a truthy result, filter forwards the original incoming value, not the predicate result. Payload identity is preserved.

<!-- FILTER-DROP -->
When the predicate returns a falsy result, filter emits nothing for that input and stays subscribed. The next input still receives the next index; dropping a value does not reset or pause the index.

<!-- FILTER-THROW -->
If the supplied function throws, the thrown value is sent through the error channel and the source subscription is released. The failing input produces no next notification and no completion follows.

<!-- FILTER-COMPLETE -->
Source completion is forwarded without invoking the callback or creating another value. The source subscription is released.

<!-- FILTER-ERROR -->
A source error is forwarded unchanged without invoking the callback. It releases the source subscription and is not followed by completion.

<!-- FILTER-CANCEL -->
Downstream cancellation releases the source subscription and stops further callback invocations. Cancellation does not emit completion.

**Time:** No timer or clock is introduced. Calling is a synchronous logical phase, not a scheduled delay; example sequence numbers order same-frame events.

**Sharing:** No sharing introduced. Each result subscription has its own index, even with a shared or hot producer.

**Callbacks:** Callback invocation is an action; return/throw is a correlated input. No callback function runs inside a guard, reaction, validator, or generator.

**Excluded:** Deprecated thisArg overload and invalid non-function callback arguments. Nested notifications or cancellation inside callbacks or observer delivery; throwing observers or finalizers. Counter precision loss beyond the safe-integer domain; proof of TypeScript predicate narrowing. A production callback/effect interpreter, runtime snapshot codec, or callback purity guarantee.

The runtime is not generated from these paragraphs. [Evidence](../evidence/M02.md) is reported separately from this specification.
