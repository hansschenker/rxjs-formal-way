# M02-B — Accumulation with scan

**Baseline:** RxJS 7.8.2, revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Schema:** existing 1.1; no schema, runner, renderer, dependency, or earlier model changes.
**Acceptance:** see [M02-B evidence](../evidence/M02-B.md). This checkpoint does not complete M02-C/D/E.

## Intuition: state that remembers a result

Source values arrive over time. Scan keeps an accumulation. When a new source value arrives and an accumulation exists, it requests one reducer call with the previous accumulation, that input, and its source index. A successful result replaces the accumulation and is emitted once.

The familiar restricted Mealy view is:

```text
(previous accumulation, incoming value) -> next accumulation
                                          + next(next accumulation)
```

The reducer is evaluated once, not once for T and again for G. Our pure model requests that evaluation as data and accepts its correlated outcome; it never executes a business function in a guard or validator.

The imported Gemini discussion supplied the seeded accumulator intuition ("Stateful Accumulators", scan example). The additional distinctions below come from the pinned RxJS implementation and this checkpoint's tests, not from assuming the imported simplified example covers every overload. Its provenance remains in the [review](reviews/2026-10-28-gemini-mealy.md).

## Two initialization policies, one accumulation mechanism

| Case | Initialization | First next | First reducer index |
|---|---|---|---|
| Seed supplied | Remember the seed, emit nothing | Call reducer(seed, value, 0) | 0 |
| No seed | No accumulated value yet | Store and emit the first input; do not call reducer | 1, on the second source value |
| Explicit undefined seed | A supplied seed, not absence | Call reducer(undefined, value, 0) | 0 |

The index is a **source-value index**, not a count of reducer invocations. RxJS increments it even when the unseeded first value bypasses the reducer.

Completion emits no extra accumulated value. An empty source completes silently with respect to next notifications, with or without a seed. A reducer result of undefined is a real accumulation; it does not switch the machine back to its empty state. Equal results are emitted again; scan does not imply distinctUntilChanged. Returned Observable values remain payloads; scan does not subscribe to them.

The canonical APIs make seed presence unambiguous:

```ts
createSeededScanModel<Input, Result, Seed = Result>(seed, callbackId?)
createUnseededScanModel<Input, Result = Input>(callbackId?)
```

The first API requires a seed argument, including when the supplied value is undefined. It also supports a seed type different from the returned accumulation type. The unseeded output type includes the first Input value as well as later Result values.

## Specification: six-tuple and product-shaped callback input

The canonical declaration is [src/models/scan.ts](../src/models/scan.ts). Both profiles use the same internal accumulation rules; only the initialization and first-value policy differ.

| Component | Meaning in this profile |
|---|---|
| S | Unsubscribed; Empty(index=0) when unseeded; Active(accumulation,index); Calling(prior accumulation,input,callId,next index); Closed(reason) |
| S0 | Fresh Unsubscribed bookkeeping for each execution |
| Z | subscribe, source next/error/complete, cancel, correlated callback return/throw |
| A | Source acquisition/release, reducer request, addressed downstream notification |
| T | Initialize, adopt first value, remember returned accumulation, update index, or close |
| G | Request a reducer, emit a value, emit a terminal, or release upstream in the specified order |

The existing schema's `CallbackInvocation<Input>` accepts a typed product as its input payload:

```text
invoke-callback
  resource = { id: callbackId, generation: sourceIndex }
  value    = { accumulator: previousAccumulation, value: sourceValue }
  index    = sourceIndex
```

The test adapter unpacks this product into the actual call:

```text
reducer(previousAccumulation, sourceValue, sourceIndex)
```

This is reuse of schema 1.1, not a new invocation tag or an extra Mealy component. Callback functions remain outside the declaration. No production effect interpreter is introduced. The test helper catches only reducer execution; a model validation error cannot be disguised as a reducer throw.

An outcome must identify the pending binding and call generation. Wrong, stale and duplicated outcomes are rejected. The model does not prove the outcome was produced by a particular function; independently executing a concrete reducer supplies that evidence.

## Rules and readable views

The seeded profile has **7 instantiated rules**. The unseeded profile has **11**, including source completion, error and cancellation before the first value. There are **12 distinct rule IDs** across the shared definitions. Coverage is reported per configured profile, not as if every rule were reachable in every mode.

A typical readable rule is:

```text
Given Calling and the outcome identifies the pending invocation
When the pending reducer returns a result
Then emit the returned accumulation once
And active with the returned accumulation and the already advanced index
```

The memory update belongs to T; the notification belongs to G. The annotation's next-state description preserves that distinction. A rule's ID links the executable reaction, BDD, STT, diagram, obligations and explanation. Authored English is reviewed annotation, not a mathematical theorem extracted from function bodies.

| Projection | Seeded | Unseeded |
|---|---|---|
| Plain behavior | [Page](../operators/scan-seeded.md) | [Page](../operators/scan-unseeded.md) |
| BDD | [BDD](../generated/scan-seeded.bdd.md) | [BDD](../generated/scan-unseeded.bdd.md) |
| Transition table | [STT](../generated/scan-seeded.stt.md) | [STT](../generated/scan-unseeded.stt.md) |
| State diagram | [STD](../generated/scan-seeded.diagram.md) | [STD](../generated/scan-unseeded.diagram.md) |
| Test obligations | [Obligations](../generated/scan-seeded.obligations.md) | [Obligations](../generated/scan-unseeded.obligations.md) |
| Four-lane trace | [Trace](../generated/scan-seeded.trace.md) | [Trace](../generated/scan-unseeded.trace.md) |
| JSON manifest | [Manifest](../generated/scan-seeded.manifest.json) | [Manifest](../generated/scan-unseeded.manifest.json) |
| JSON trace | [Trace](../generated/scan-seeded.trace.json) | [Trace](../generated/scan-unseeded.trace.json) |

The generator now has five configured profiles for four operators: take, map, filter and both scan modes. It checks **40 projections**. The earlier 24 projections are unchanged.

## Time, cancellation, and ownership

Scan creates no clock, timer, asynchronous work, or concurrency policy. The source/test scheduler supplies time. A request and its return can share a timestamp but occupy separate ordered trace steps. Calling is synchronous logical bookkeeping; this does not convert the reducer into an asynchronous effect.

Cancellation between resolved value reactions releases upstream without any extra value or completion. A source error bypasses the reducer. A reducer throw errors downstream and releases upstream; that failing input does not produce an accumulated next value. Closed executions have no admissible inputs. A late actual producer attempt and a legal model event are different things.

Each subscription owns its accumulation **binding**, index, and pending-call bookkeeping. It does not necessarily own a unique accumulation **object**. RxJS does not clone a supplied object seed. Reusing a pipeline with a mutating reducer can therefore expose the same seed object across subscriptions. Immutable updates prevent that particular aliasing problem without inventing cloning semantics. A fresh source subscription on retry also reuses the original seed reference; it does not undo external mutation.

The model preserves object identities. Its traces retain references rather than immutable snapshots. Mutation by a reducer or external observer can change previously retained objects; that is not represented as an explicit mutation event here. Differential tests use deterministic, immutable reducers. A separate native runtime test characterizes mutable-seed aliasing rather than claiming immutable snapshot support.

Sharing remains explicit. Placing scan before share can share an accumulated execution. Placing scan after share gives each downstream scan subscription its own accumulation binding. This checkpoint tests those native pipeline interactions; it does not implement share's formal model or a generic pipeline composer.

## Verification strategy

29 new model tests cover literal initialization, correlated outcomes, object/undefined identity, rule reachability, counter limits, state invariants, illegal reentry, terminal reuse, corrupted reactions and generated views. Ten negative type assertions check seed/result/input distinctions, product arguments, required state, and readonly parameters.

23 new RxJS test cases cover the semantics above, cooperative synchronous cancellation, hot input, retry and sharing placement, type-changing accumulation, and non-flattened Observable results. The last contains this bounded differential experiment:

```text
10 deterministic reducer/seed profiles
x 31 binary input words of lengths 0..4
x 3 endings (complete, error, cancel)
x 2 schedules (spaced, same frame)
= 1860 independent model/RxJS comparisons
```

Each compares reducer arguments, source index, output notifications, virtual time and source acquisition/release order. Literal runtime examples provide additional expectations not derived from the model. Prior tests, type fixtures, lockfile, and the 465 take / 1302 map-filter comparisons remain intact.

The expected combined suite is 171 named tests (119 retained + 29 model + 23 runtime), with 24 negative type assertions and 40 generated checks. Actual results and tested revisions belong in [the evidence record](../evidence/M02-B.md), not in expected counts.

## Scope and limits

The profile assumes valid synchronous reducers, non-reentrant source/reducer/observer behavior, nonthrowing observers and finalizers, and cancellation between fully resolved source reactions. Source events or cancellation during Calling are excluded interleavings, not secretly queued. Arbitrary nested delivery requires a more detailed execution model.

Indices are nonnegative safe integers. A state at the boundary may terminate but cannot accept a next that overflows that domain. This is a model scope restriction, not an assertion that RxJS throws for long streams.

Seed/result values are arbitrary typed payloads in memory. Generated examples use JSON-safe numbers. Explicit undefined seeds are preserved by the in-memory discriminant, but JSON.stringify can omit undefined fields; these manifests are descriptive examples, not a lossless serialization or executable loader for arbitrary values.

No universal interpreter, exhaustive equivalence proof, full dependent-type encoding, or completed M02 timer/higher-order/shared profile is claimed.

## Reproduction and next step

```sh
npm ci --ignore-scripts
npm run check
npm run test:model
npm run generate
npm run check:generated
```

Next: M02-C, debounceTime. Preserve this baseline while adding explicit timer identity, pending-value replacement, completion flush, error/cancellation discard and equal-time scheduling assumptions.

## Pinned primary sources

- [scan overloads and seed-presence detection](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scan.ts)
- [scanInternals: hasState, accumulation, index and emission policy](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scanInternals.ts)
- [OperatorSubscriber: callback exception routing](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)
- [Subscriber: notifications and finalization](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)
