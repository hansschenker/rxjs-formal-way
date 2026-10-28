# map: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Transform each incoming value through a supplied projection without changing its delivery policy.

**Scope:** A named callback binding; nonnegative safe-integer callback indices below overflow. Non-reentrant source, callback and observer behavior; cancellation only between fully resolved value reactions.

**Dataflow shape:** `map : (T! x Index! -> R!) -> T* -> R*`. One output per successfully returned projection while the subscription remains active; throwing produces an error instead. Signatures describe successful value flow, not guarantees against errors or cancellation. The full callback receives a zero-based source-notification index. Filter runtime truthiness is modeled even though its usual TypeScript predicate returns boolean.

<!-- MAP-INIT -->
Subscribing to map connects to the source and starts a fresh callback index at zero. Constructing the pipeline does not invoke the callback.

<!-- MAP-CALL -->
Each incoming value invokes the supplied function once with that value and its zero-based source index. The index advances for every invocation, independently of whether a value is subsequently forwarded.

<!-- MAP-RETURN -->
A successful projection result is forwarded as exactly one value, including undefined, an object, or an Observable. Map does not flatten or subscribe to the returned value.

<!-- MAP-THROW -->
If the supplied function throws, the thrown value is sent through the error channel and the source subscription is released. The failing input produces no next notification and no completion follows.

<!-- MAP-COMPLETE -->
Source completion is forwarded without invoking the callback or creating another value. The source subscription is released.

<!-- MAP-ERROR -->
A source error is forwarded unchanged without invoking the callback. It releases the source subscription and is not followed by completion.

<!-- MAP-CANCEL -->
Downstream cancellation releases the source subscription and stops further callback invocations. Cancellation does not emit completion.

**Time:** No timer or clock is introduced. Calling is a synchronous logical phase, not a scheduled delay; example sequence numbers order same-frame events.

**Sharing:** No sharing introduced. Each result subscription has its own index, even with a shared or hot producer.

**Callbacks:** Callback invocation is an action; return/throw is a correlated input. No callback function runs inside a guard, reaction, validator, or generator.

**Excluded:** Deprecated thisArg overload and invalid non-function callback arguments. Nested notifications or cancellation inside callbacks or observer delivery; throwing observers or finalizers. Counter precision loss beyond the safe-integer domain; proof of TypeScript predicate narrowing. A production callback/effect interpreter, runtime snapshot codec, or callback purity guarantee.

The runtime is not generated from these paragraphs. [Evidence](../evidence/M02.md) is reported separately from this specification.
