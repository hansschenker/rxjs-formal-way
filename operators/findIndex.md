# findIndex: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit the zero-based index of the first source value whose predicate is truthy; emit -1 if no match exists.

**Scope:** Required predicate; deprecated thisArg and BooleanConstructor specialization excluded.. One pending predicate result at a time.

**Dataflow shape:** `findIndex : (T! x Index! -> Boolean!) -> T* -> Number!`. Finite successful execution emits exactly one integer: first matching index or -1. First truthy result short-circuits source work. Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.

<!-- FINDINDEX-INIT -->
findIndex evaluates source values in order.

<!-- FINDINDEX-CALL -->
Predicate receives original value and current source index.

<!-- FINDINDEX-MATCH -->
The output is the zero-based position of the first matching value.

<!-- FINDINDEX-MISS -->
A rejected value consumes its index.

<!-- FINDINDEX-THROW -->
Predicate errors do not become -1.

<!-- FINDINDEX-NOT-FOUND -->
No match is a successful -1 result, not an error.

<!-- FINDINDEX-SOURCE-ERROR -->
Source error suppresses -1.

<!-- FINDINDEX-CANCEL -->
Cancellation emits no sentinel.

**Time:** No timer; source order defines index.

**Sharing:** No sharing is introduced; each result subscription owns independent state and resources.

**Callbacks:** One correlated predicate outcome per tested value.

**Excluded:** Deprecated thisArg overload, callback reentry, observer/finalizer exceptions.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-12.md) is reported separately from this specification.
