# catchError: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward source values; on the first source error, invoke a selector and subscribe to its replacement stream.

**Scope:** One source and one Observable replacement, without recursive caught resubscription.. Model resolution of synchronous selector call is atomic; no arbitrary recursion/reentrant downstream/finalizer behavior.

**Dataflow shape:** `catchError : T* × (E -> R*) -> (T|R)*`. Source next values flow unchanged until source error or completion. One source error is intercepted, not delivered downstream, and replaced by zero or more values from the selected Observable. Replacement completion completes output; replacement error propagates without another selector call in this scoped single-replacement execution.

<!-- CATCHERROR-INIT -->
Only a subscriber starts source work.

<!-- CATCHERROR-SOURCE-NEXT -->
The source value is forwarded without transformation.

<!-- CATCHERROR-SOURCE-ERROR -->
The original error is not sent downstream; it is handed to selector.

<!-- CATCHERROR-SELECTOR-RETURN -->
The original producer is finalized before recovery subscribes, even after a synchronous error.

<!-- CATCHERROR-SELECTOR-THROW -->
Selector failure terminates without subscribing replacement.

<!-- CATCHERROR-SOURCE-COMPLETE -->
Successful completion never invokes recovery selector.

<!-- CATCHERROR-REPLACEMENT-NEXT -->
Every replacement value is forwarded unchanged.

<!-- CATCHERROR-REPLACEMENT-COMPLETE -->
Output completes when recovery finishes.

<!-- CATCHERROR-REPLACEMENT-ERROR -->
Errors from the replacement are not intercepted by the same selector.

<!-- CATCHERROR-CANCEL-SOURCE -->
Explicit cancellation never synthesizes a complete or error notification.

<!-- CATCHERROR-CANCEL-CALLING -->
Explicit cancellation never synthesizes a complete or error notification.

<!-- CATCHERROR-CANCEL-REPLACEMENT -->
Explicit cancellation never synthesizes a complete or error notification.

**Time:** No new timing policy. The replacement Observable determines emission times; synchronous source errors require original-source teardown before replacement connection.

**Sharing:** No sharing; each output subscription owns its original and possible replacement source subscriptions.

**Callbacks:** The selector receives the exact error and a caught Observable. The model requests a correlated callback invocation and receives a resolved return/throw event; it does not execute user code.

**Excluded:** Selectors returning Promise or arbitrary ObservableInput conversion; returning caught recursively; synchronous reentrant producer or observer behavior. Selector cancellation in the middle of execution and observer/finalizer throws. A universal retry/resubscription model, which must be specified separately.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-08.md) is reported separately from this specification.
