# last: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Retain the final selected source value; reveal exactly one result only after source completes successfully.

**Scope:** Predicate enabled true; explicit default supplied false; default can be undefined.. Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Dataflow shape:** `last(P?,D?) : T* -> (T|D)?`. No downstream next before successful source completion. A matching candidate yields one next then complete. No candidate yields explicit default or EmptyError. Predicate indices count all source next notifications, including those rejected. Cω describes next cardinality. Error, complete, cancellation, and resource release are separate events.

<!-- S13-LAST-INIT -->
No candidate is present initially, including no phantom undefined candidate.

<!-- S13-LAST-TAKE -->
Overwrite the candidate on every input without retaining older elements.

<!-- S13-LAST-CHECK -->
Do not decide acceptance before the external callback outcome.

<!-- S13-LAST-MATCH -->
Last matching value replaces the previous candidate; no next yet.

<!-- S13-LAST-REJECT -->
Predicate selection is a local state policy, not output filtering yet.

<!-- S13-LAST-PREDICATE-ERROR -->
An exception aborts the selection; no fallback is emitted.

<!-- S13-LAST-EMIT-LAST -->
Only successful completion can expose the retained candidate.

<!-- S13-LAST-EMIT-DEFAULT -->
An explicit undefined fallback is distinct from no argument.

<!-- S13-LAST-EMPTY-ERROR -->
No matching input is an error without a configured fallback.

<!-- S13-LAST-SOURCE-ERROR -->
No candidate or fallback is emitted when source fails.

<!-- S13-LAST-CANCEL -->
A cancelled stream never emits the retained value.

**Time:** No timer. Output occurs at successful source completion time; cancellation or error produces no retained candidate.

**Sharing:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Callbacks:** When selected, indexed predicate receives source value/index/original source; pure model requests callback and receives a correlated truthy/falsy or throw event.

**Excluded:** Deprecated thisArg/BooleanConstructor type-narrowing signatures as distinct run-time policies; reentrant callback/source; observer throwing.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-13.md) is reported separately from this specification.
