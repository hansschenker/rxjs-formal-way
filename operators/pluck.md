# pluck: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Deprecated nested-property projection implemented as a map; preserves value order and timing.

**Scope:** One to three non-empty own/plain-data string property keys; no empty paths.. Atomic non-reentrant source notifications and primitive/plain-object property access.

**Dataflow shape:** `pluck(path) : T* -> U* (one output next per source next)`. Every source next yields exactly one projected value, even if the property is missing. The source error/completion and the downstream cancellation control termination; there is no inner Observable. Projection does not share, resubscribe or schedule the input.

<!-- S16-PLUCK-INIT -->
One independent cold execution begins for each downstream subscription.

<!-- S16-PLUCK-NEXT -->
Walk the configured keys in order. A null or undefined intermediate stops the walk and produces undefined.

<!-- S16-PLUCK-COMPLETE -->
The operator adds no values on completion.

<!-- S16-PLUCK-ERROR -->
Source failure is not converted into a property value.

<!-- S16-PLUCK-CANCEL -->
Cancellation stops this independent projection execution.

**Time:** No clock or scheduler is introduced; every projected output occurs in its source notification step.

**Sharing:** None; each subscription independently projects one source.

**Callbacks:** No user callback; read nested plain data directly as in the pinned map-based implementation.

**Excluded:** Getters and proxies with side effects or throws, symbol keys, dynamically mutated paths. Constructor-time error for zero path elements is represented by factory rejection, not a stream notification.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-16.md) is reported separately from this specification.
