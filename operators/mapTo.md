# mapTo: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Preserve every emission moment but replace each input with the same captured constant.

**Scope:** One captured constant, including undefined or object identities. Deprecated operator export in RxJS 7.8.2.. Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Dataflow shape:** `mapTo(R!) : T* -> R*`. Exactly one output next for each source next while live. Each output value is exactly the captured R reference, not a clone. No extra time, subscription, sharing or scheduler policy. Cω describes next cardinality. Error, complete, cancellation, and resource release are separate events.

<!-- S13-MAPTO-INIT -->
Constant is captured at operator construction, independent source execution starts on subscription.

<!-- S13-MAPTO-REPLACE -->
No input payload is inspected and the constant is not cloned or invoked.

<!-- S13-MAPTO-COMPLETE -->
No delayed values remain.

<!-- S13-MAPTO-ERROR -->
Error identity is unchanged.

<!-- S13-MAPTO-CANCEL -->
Cancellation does not emit the constant.

**Time:** Every output has the arrival time of its source next.

**Sharing:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Callbacks:** Internally implemented by map(() => value); modeled as no external variable callback.

**Excluded:** Callback binding and operator-construction anomalies; observer reentrancy.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-13.md) is reported separately from this specification.
