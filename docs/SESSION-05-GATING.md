# Session 5 — Count, predicate and notifier gates

## Scope, workflow and source pin

This session works on exactly five RxJS **7.8.2 operator export names**:
`skip`, `takeWhile`, `skipWhile`, `takeUntil`, and `skipUntil`.
Inclusive/exclusive `takeWhile` configurations are profiles of one name.
The existing schema 1.1, runner, renderers, validation commands and earlier
models are retained. This is not a replacement operator implementation.

```text
Pinned source + explicit configuration and execution scope
                            ↓
Canonical TypeScript model + guarded, named transition rules
             ┌──────────────┼───────────────────┐
             ↓              ↓                   ↓
         BDD / prose    STT / diagram       Test obligations
                            ↓                   ↓
                    Concrete input trace   Actual RxJS tests
                            ↓                   ↓
                      Four-lane view       Recorded evidence
```

The source revision is `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
The five implementations were inspected rather than inferred from operator
names or copied from a general Mealy wrapper:

| Export | Pinned implementation | Canonical model | Readable view |
|---|---|---|---|
| skip | [skip.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skip.ts) | [gating.ts](../src/models/gating.ts) | [skip](../operators/skip.md) |
| takeWhile | [takeWhile.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeWhile.ts) | [gating.ts](../src/models/gating.ts) | [takeWhile](../operators/takeWhile.md) |
| skipWhile | [skipWhile.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skipWhile.ts) | [gating.ts](../src/models/gating.ts) | [skipWhile](../operators/skipWhile.md) |
| takeUntil | [takeUntil.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeUntil.ts) | [until.ts](../src/models/until.ts) | [takeUntil](../operators/takeUntil.md) |
| skipUntil | [skipUntil.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skipUntil.ts) | [until.ts](../src/models/until.ts) | [skipUntil](../operators/skipUntil.md) |

The supporting sources are pinned `filter.ts`, `OperatorSubscriber.ts`,
`Subscriber.ts`, `Observable.ts` and `Subscription.ts`; their URLs are also
retained in the generated manifests. English comments are not substituted
for executable source behavior. For example, `skipWhile` stops testing at
the **first falsy** predicate result, despite a contradictory sentence in
its source comment.

## What flows, and which boundary changes delivery?

Every emitted value in this batch is an original source value. Neither a
predicate result nor a notifier payload is forwarded as a source value.
None of these operators buffers dropped values for later recovery.

| Export | Remembered delivery policy | Boundary action |
|---|---|---|
| skip(n) | Count source next notifications from index zero | First n values are silent; later values pass |
| takeWhile(p) | Keep testing until p first returns falsy | Complete; inclusive optionally forwards that boundary value first |
| skipWhile(p) | Keep testing until p first returns falsy | Forward that value, permanently open, never call p again |
| takeUntil(notifier) | Source gate initially open | First notifier next completes the result |
| skipUntil(notifier) | Source gate initially closed | First notifier next opens it and unsubscribes from notifier |

A notifier completion is **not** a next notification. Empty notifier
completion leaves takeUntil open and skipUntil closed. Source completion
still completes either result; an error from either connected input errors
it. Downstream cancellation releases resources without emitting completion.

## Cω-style value shapes

```text
skip      : Count! -> T* -> T*
takeWhile : (T! x Index! -> Boolean!) x Inclusive! -> T* -> T*
skipWhile : (T! x Index! -> Boolean!) -> T* -> T*
takeUntil : U* -> T* -> T*
skipUntil : U* -> T* -> T*
```

Count, Index and Inclusive name the parameter domains; the notation is the
project's Cω-inspired description, not a claim that it is original Cω
syntax. The shapes count values, not lifecycle/resource actions. For m
source values followed by successful completion, skip(n) forwards exactly
max(0,m-n) values in the scoped nonnegative-integer domain. takeWhile emits
a prefix; skipWhile emits a suffix beginning with its first predicate-failing
value. Until shapes do not identify a prefix/suffix using timestamps alone:
the delivery order of simultaneous source and notifier events matters.

## Six-tuple: skip

`M = (S, S₀, Z, A, T, G)` uses the unchanged combined-reaction contract.

| Component | Concrete meaning |
|---|---|
| S | Unsubscribed, Active(index), or Closed(reason); index is a nonnegative safe integer |
| S₀ | Unsubscribed, with no source resource |
| Z | subscribe, source.next(value), source.complete, source.error(error), cancel |
| A | Subscribe/unsubscribe source, or downstream N/C/E |
| T | Initialize index zero; advance once for each source next; enter Closed on termination/cancellation |
| G | Drop while index < count; otherwise forward the input; terminal notification precedes source cleanup |

Pinned skip delegates to filter with `count <= index`. The model directly
represents that internal comparison, not a user-function invocation. It
retains the index even after the gate opens. skip(0) still acquires the
source. Completion before n values is normal completion, not an error.
The accepted count profile excludes negative/fractional/NaN/infinite counts;
that exclusion is not a claim about how native RxJS handles those numbers.

## Six-tuple: takeWhile

| Component | Concrete meaning |
|---|---|
| S | Unsubscribed, Testing(index), Calling(index,callId,input), Closed(reason) |
| S₀ | Unsubscribed |
| Z | Source/downstream lifecycle plus matching predicate return or throw |
| A | Source subscribe/unsubscribe, one predicate invocation request, downstream N/C/E |
| T | Testing next enters Calling and advances index; truthy return resumes Testing; falsy return closes |
| G | Truthy return emits the original input; falsy emits C, optionally preceded by N(input); throw emits E instead |

The predicate is external business logic. A call action carries input,
zero-based index and invocation identity. Guards inspect only the supplied
outcome; they never execute the predicate. Inclusive applies to a **falsy
return**, not a thrown exception. Both configured profiles have eight rules;
one inclusive example is generated, while both policies are tested.

## Six-tuple: skipWhile

| Component | Concrete meaning |
|---|---|
| S | The predicate-call states above, plus a permanent Open state |
| S₀ | Unsubscribed |
| Z | Source/downstream lifecycle plus matching predicate outcomes while Calling |
| A | Source resource actions, predicate invocation requests, downstream N/C/E |
| T | Truthy return resumes Testing; first falsy return enters Open; Open cannot return to Testing |
| G | Truthy is silent; first falsy emits its retained input; all later source next values pass without any invocation |

This is not a filter that continues reevaluating a condition. Its gate is
one-way. A later value that would satisfy the predicate is still forwarded,
and a predicate that would throw on that later value is not called.
The model has twelve rules, including lifecycle events from both Testing
and Open. The predicate index is no longer retained after opening because
no later observable action can consult it in this declared profile.

## Six-tuples: takeUntil and skipUntil

| Component | takeUntil | skipUntil |
|---|---|---|
| S | Unsubscribed, Starting(open,notifierLive), Active(open,notifierLive), Closed(reason) | Same controls plus StoppedBeforeSource after a synchronous notifier error |
| S₀ | Unsubscribed | Unsubscribed |
| Z | Subscribe, setup.ready, source N/C/E, live notifier N/C/E, cancel | Same alphabet |
| A | Source/notifier subscribe/unsubscribe and downstream N/C/E | Same alphabet; includes an already-closed source attempt in one setup path |
| T | Start open; notifier next closes; notifier complete only clears notifier liveness | Start closed; notifier next permanently opens and clears notifier liveness; notifier complete leaves gate unchanged |
| G | Open source values pass; notifier next emits C then cleanup | Closed source values are silent; notifier next only releases notifier; open source values pass |

Each model knows whether a source subscription has actually been attempted.
The notifier subscription is acquired first. `setup.ready` explicitly marks
return from that subscription call before source initialization continues.
It is a synchronous environment microstep, not a timer or a new asynchronous
turn. Until-source resource identities are fixed at generation zero within
each executionId; they are not reused after release.

### Synchronous notifier setup is observably different

| Notifier during subscribe | takeUntil source attempt | skipUntil source attempt |
|---|---|---|
| No synchronous notification | Subscribe after setup returns | Subscribe with gate closed |
| next(any value) | No source subscription; downstream completes | Subscribe with gate open |
| complete without next | Subscribe; gate remains open | Subscribe; gate remains closed |
| error | No source subscription; downstream errors | Attempt source.subscribe with subscriber.closed already true |

The final row is deliberately preserved. takeUntil tests `!subscriber.closed`
before source.subscribe; skipUntil does not. Observable.subscribe can invoke
a source initializer with an already-closed subscriber and immediately
dispose its returned teardown. The `StoppedBeforeSource` control is therefore
**not downstream reopening**: it permits only the remaining setup.ready
step, which records source attempt/disposal and no notification.
The native test checks the closed flag directly, not merely output silence.

For post-setup completion/error/cancellation, a still-live notifier is
released before the source, matching registration order. For skipUntil's
opening signal, notifier unsubscribe occurs without downstream notification;
subsequent notifier attempts are stopped at its closed Subscriber.

## State-dependent legal behavior and invariants

The dependent-behavior reading is still:

```text
Behavior :
  (state : S) ->
  (event : E state) ->
  Σ (nextState : S). Actions state event nextState
```

Applied to these operators, this means more than typing stored fields:

| State or event | Required relation |
|---|---|
| Active skip source.next | Index is below the safe-integer limit; next index increases exactly once |
| Calling predicate | Only its matching invocation return/throw is admissible; input identity remains available |
| Open skipWhile | No predicate invocation is produced, and no predicate outcome is a legal input |
| Starting until | Source notifications are illegal before setup.ready; notifier may synchronously signal/terminate |
| Notifier event | Notifier resource is live and has the expected id and generation |
| Closed result | No further model notifications or subscriptions are admissible |
| StoppedBeforeSource | Only the remaining closed-source setup attempt is admissible; no downstream emission may follow error |
| Terminal action word | Preserve N-before-C for inclusive takeWhile; never confuse cancellation with C |

TypeScript provides discriminated unions and eighteen new negative type
fixtures; runtime validators enforce additional relations such as correlated
identity, action ordering and payload identity. They are **not** dependent
proofs or a universal equivalence theorem. Rule reachability, exact literals,
mutated-action rejection and independent native tests provide separate evidence.

## Time, cancellation and sharing

Time is supplied by source/notifier schedules, never invented by these
operators. A next and a notifier signal at the same timestamp can produce
different outputs depending on which is delivered first. Tests run both
orders. Predicate requests and their outcomes resolve within one frame in
the test driver. The generic trace runner verifies nondecreasing timestamps;
that alone does not prove an arbitrary supplied trace respects synchronous
microstep timing. The synchronous-phase contract remains an explicit
environment assumption outside the specialized drivers.

Every gate is subscription-local. Reusing an operator or subscribing twice
to a result does not share its count or predicate state. A hot producer does
not change that ownership. For until operators, each result subscription
acquires its own source and notifier subscriptions. None introduces share.
Cancellation stops notification delivery and releases subscriptions; it does
not promise that an uncooperative physical producer aborts all underlying work.

## Generated artifacts and traceability

For each of the five names, the unchanged renderer emits:

```text
generated/<operator>.bdd.md
generated/<operator>.stt.md
generated/<operator>.diagram.md
generated/<operator>.obligations.md
generated/<operator>.manifest.json
generated/<operator>.trace.json
generated/<operator>.trace.md
operators/<operator>.md
```

The generator uses skip(2), inclusive takeWhile, skipWhile and one example
for each notifier operator: five names, forty views. Named rules link BDD,
STT, diagram edges and test obligations. The JSON manifest stores reviewed
rule descriptions, not executable function bodies. Concrete traces and
four-lane views are **model predictions**, not recordings of native RxJS.
The source metadata and this guide supply the six-tuple and legal-behavior
interpretation; reviewed prose is not automatically proved equivalent to code.

## Verification design and limits

`tests/session05-model.test.mjs` validates the pure models, reaches every
configured rule, rejects foreign/consumed outcomes, checks mutation and
ownership boundaries, and exercises the existing renderers. The native
path in `tests/helpers/session05-native.mjs` imports actual RxJS exports;
it never executes a canonical model as the implementation under test.

Independent literal cases and marble subscriptions check notifications,
original input references, callback arguments and indices, errors, inclusive
boundary ordering, notifier-first setup, closed-source attempts, and each
resource lifetime. Bounded schedules are enumerated without consulting a
model's expected output. Identical timestamps and distinct timestamps are
both covered. Later producer attempts on a closed Subscriber are suppressed
before reaching the pure model; they are not silently accepted as legal
post-terminal model inputs.

The declared exact-comparison scope is non-reentrant post-setup delivery,
plus the explicit synchronous notifier setup cases. Native synchronous
source and downstream-take checks are recorded separately. Arbitrary reentry,
throwing observers/finalizers, general ObservableInput conversion, predicate
cancellation mid-call, invalid numeric profiles and a production interpreter
remain outside acceptance. Refer to [the evidence record](../evidence/SESSION-05.md)
for executed checks, exact tested revision and retrieved CI outcome; do not
infer acceptance from this guide or generated files alone.
