# throwIfEmpty: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Mirror source values, but turn successful empty completion into a lazily created error.

**Scope:** Default EmptyError factory binding or a custom synchronous error factory.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `throwIfEmpty : Cω(() → unknown) → T* → T*`. Every source next is forwarded unchanged. Successful completion without next invokes one factory and errors; cancellation invokes none.

<!-- S20-THROWIFEMPTY-START -->
Emptiness is assessed separately for each subscription.

<!-- S20-THROWIFEMPTY-NEXT -->
The presence bit, not the payload, establishes nonemptiness.

<!-- S20-THROWIFEMPTY-COMPLETE-NONEMPTY -->
A nonempty source is mirrored without manufacturing an extra value.

<!-- S20-THROWIFEMPTY-COMPLETE-EMPTY -->
The factory is called at empty completion, not at construction, source failure, or cancellation.

<!-- S20-THROWIFEMPTY-FACTORY-RETURN -->
Returned values are error-channel payloads, not next values. The default binding supplies a fresh EmptyError instance.

<!-- S20-THROWIFEMPTY-FACTORY-THROW -->
A throwing custom factory is intercepted by the operator subscriber.

<!-- S20-THROWIFEMPTY-SOURCE-ERROR -->
Source failure is not empty successful completion.

<!-- S20-THROWIFEMPTY-CANCEL -->
A cancelled empty subscription is not an EmptyError.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** One explicit invocation at empty completion. Its return/throw is supplied as a correlated outcome; the canonical model never calls it.

**Excluded:** Concrete EmptyError prototype construction is checked natively; the model treats the valid default-factory outcome as an opaque object. An outcome attributed to the default binding is assumed to come from that pinned constructor, not an arbitrary substituted factory. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-20-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-20.md) is reported separately from this specification.
