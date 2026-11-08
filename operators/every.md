# every: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Quantify that all source values satisfy an indexed predicate, short-circuiting on the first falsy result.

**Scope:** Required synchronous indexed predicate; without thisArg overload.. Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Dataflow shape:** `every(p) : T* -> Boolean!`. On successful finite completion emit true once, including the empty input (vacuous truth). On first falsy result emit false once and complete early; source error, callback throw or cancellation never emits a boolean. Cω counts next values; terminal notifications, resource release and cancellation are separate obligations.

<!-- EVERY-INIT -->
Every subscriber has independent predicate index.

<!-- EVERY-CALL -->
The predicate is a user function; the canonical model requests its outcome but never executes it.

<!-- EVERY-TRUE -->
Every true predicate result is silent until source completion.

<!-- EVERY-FALSE -->
First falsy predicate result terminates immediately; no later source values are evaluated.

<!-- EVERY-THROW -->
Thrown errors are not interpreted as false.

<!-- EVERY-SOURCE-COMPLETE -->
Vacuous truth applies to the empty sequence.

<!-- EVERY-SOURCE-ERROR -->
Source error does not produce a final truth value.

<!-- EVERY-CANCEL -->
Cancellation before decision produces no boolean.

**Time:** No clock; predicate return is a synchronous logical microstep. Completion or first falsy result determines output time.

**Sharing:** None; independent operator state per subscription even if the upstream happens to be shared.

**Callbacks:** Synchronous predicate (value,index,source), represented as a correlated invocation/outcome pair; user code is not executed by model.

**Excluded:** thisArg overload and user callback reentrancy. Callback cancellation and Index > MAX_SAFE_INTEGER. Thrown downstream observer/finalizer exceptions.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-11.md) is reported separately from this specification.
