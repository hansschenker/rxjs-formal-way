# isEmpty: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit false and complete upon first next; emit true and complete only on empty successful completion.

**Scope:** No arguments.. Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Dataflow shape:** `isEmpty : T* -> Boolean?`. Successful finite execution emits exactly one boolean. First source next ends the upstream subscription before further cooperative next values. Error/cancel emits no boolean. Cω describes next cardinality. Error, complete, cancellation, and resource release are separate events.

<!-- S13-ISEMPTY-INIT -->
Start upstream when the result is connected.

<!-- S13-ISEMPTY-NONEMPTY -->
Any source next, even undefined, disproves emptiness and terminates immediately.

<!-- S13-ISEMPTY-EMPTY -->
An empty, successfully terminated source has exactly one boolean output.

<!-- S13-ISEMPTY-ERROR -->
A failed source is not classified as empty.

<!-- S13-ISEMPTY-CANCEL -->
Cancellation gives no true/false answer.

**Time:** No timer; decision is synchronous on first next or empty completion.

**Sharing:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Callbacks:** No callback or source value inspection.

**Excluded:** Synchronous reentry within observer callbacks.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-13.md) is reported separately from this specification.
