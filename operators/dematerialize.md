# dematerialize: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Turn source next(notification) into the represented downstream next, error or complete.

**Scope:** No arguments. Source values are well-formed RxJS Notification objects with kind N, E or C.. Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Dataflow shape:** `dematerialize : Notification<T>* -> T*`. N forwards exactly one payload; E/C terminate immediately, even if the upstream would send more values. An upstream ordinary complete or error is forwarded when no embedded terminal has arrived. Cω counts next values; terminal notifications, resource release and cancellation are separate obligations.

<!-- DEMATERIALIZE-INIT -->
Nothing executes until subscribed.

<!-- DEMATERIALIZE-NEXT -->
A materialized next is a downstream next.

<!-- DEMATERIALIZE-EMBEDDED-COMPLETE -->
An embedded complete terminates before the outer sequence needs to complete.

<!-- DEMATERIALIZE-EMBEDDED-ERROR -->
An embedded error is the terminal error, with its original identity.

<!-- DEMATERIALIZE-SOURCE-COMPLETE -->
An ordinary outer completion is still forwarded.

<!-- DEMATERIALIZE-SOURCE-ERROR -->
Malformed upstream failure does not count as a materialized value.

<!-- DEMATERIALIZE-CANCEL -->
Cancellation never synthesizes completion.

**Time:** No scheduler or timer; synchronous arrival order controls termination.

**Sharing:** None; independent operator state per subscription even if the upstream happens to be shared.

**Callbacks:** None. Notification payloads and error objects remain opaque.

**Excluded:** Malformed notification objects and observer exceptions. Nested synchronous reentry and delivery after terminal are rejected by the model.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-11.md) is reported separately from this specification.
