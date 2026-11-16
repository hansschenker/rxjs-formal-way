# single-indexed-predicate: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S19-SINGLE-START | Unsubscribed | subscribe | first downstream subscriber | subscribe source; initialize presence bits and index | Retain precisely the state memory and resource ownership described by this rule. | S19-SINGLE-START |
| S19-SINGLE-CANDIDATE | Active | source.next | no predicate and no previous candidate | retain first source value without notifying | Retain precisely the state memory and resource ownership described by this rule. | S19-SINGLE-CANDIDATE |
| S19-SINGLE-SECOND | Active | source.next | no predicate and candidate already stored | error with SequenceError; unsubscribe source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-SECOND |
| S19-SINGLE-PREDICATE | Active | source.next | predicate selected and index safe | request indexed predicate for original source value | Retain precisely the state memory and resource ownership described by this rule. | S19-SINGLE-PREDICATE |
| S19-SINGLE-REJECT | Calling | callback.return | correlated false predicate result | advance predicate index; retain previous candidate if any | Retain precisely the state memory and resource ownership described by this rule. | S19-SINGLE-REJECT |
| S19-SINGLE-FIRST-MATCH | Calling | callback.return | correlated true result and no prior match | retain original source value; advance predicate index | Retain precisely the state memory and resource ownership described by this rule. | S19-SINGLE-FIRST-MATCH |
| S19-SINGLE-DUPLICATE-MATCH | Calling | callback.return | correlated true result and prior matching value exists | error with SequenceError; release source immediately | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-DUPLICATE-MATCH |
| S19-SINGLE-PREDICATE-THROW | Calling | callback.throw | correlated predicate exception | propagate exact thrown object; release source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-PREDICATE-THROW |
| S19-SINGLE-FOUND | Active | source.complete | one matching candidate stored | emit retained original value; complete; release source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-FOUND |
| S19-SINGLE-EMPTY | Active | source.complete | no source values ever observed | emit EmptyError; release source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-EMPTY |
| S19-SINGLE-NOT-FOUND | Active | source.complete | source was non-empty but predicate matched nothing | emit NotFoundError; release source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-NOT-FOUND |
| S19-SINGLE-SOURCE-ERROR | Active | source.error | live source fails | forward exact source error; release source | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-SOURCE-ERROR |
| S19-SINGLE-CANCEL-ACTIVE | Active | cancel | consumer cancels | release source without a next/error/complete notification | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-CANCEL-ACTIVE |
| S19-SINGLE-CANCEL-CALLING | Calling | cancel | consumer cancels | release source without a next/error/complete notification | Final terminal reason; state is no longer admissible for input. | S19-SINGLE-CANCEL-CALLING |
