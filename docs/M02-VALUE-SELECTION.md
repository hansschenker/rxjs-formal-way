# M02-A — Value transformation and selection

**Implemented scope:** map and filter, on RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Schema:** 1.1, retaining 1.0 support for take.
**Acceptance:** see [M02 evidence](../evidence/M02.md); authored tests are not executed evidence.

M02 expands the reference set. This checkpoint implements its first pair, not all remaining reference operators. Scan, debounceTime, switchMap and share remain scheduled in the [roadmap](ROADMAP.md).

## Intuition: what flows and what each operator remembers

Values arrive from one source. Map requests a projection and forwards its returned value. Filter requests a predicate and either forwards the original input or emits nothing. Neither introduces time, concurrency, sharing or an inner subscription. Returned Observables are ordinary map payloads, not work to subscribe to.

Calling these operators stateless is useful only for a restricted value-only lens. Their full indexed overloads retain a per-subscription counter. Filter advances that counter even when it drops a value. The index downstream of a filter counts values reaching that downstream operator, not values the filter rejected.

This distinction is observable in `filter(...), map(...), take(2)`: the filter and map have different local index sequences, while take can cancel the entire upstream subscription chain. Runtime witnesses `M02-PIPE-01` and `M02-PIPE-02` check cancellation and callback-failure propagation. They do not establish a general pipeline-model composer.

## Specification: callback invocation is an explicit boundary

A user callback may return or throw, and may contain business effects. Evaluating it in every candidate guard would invoke it more than once. Treating it as automatically pure would hide a real assumption. The models therefore do not accept executable functions:

```text
createMapModel<T, R>('project')
createFilterModel<T>('predicate')
```

The string identifies an external binding. The pure specification produces an invocation request and receives its outcome:

```text
Active(index)
  source.next(value)
       ↓
Calling(input=value, callId=index, index=index+1)
       + invoke-callback(binding, generation=index, value, index)
       ↓
callback.return(same identity, result)
  map:    notify next(result) → Active(next index)
  filter: truthy → notify next(original input) → Active(next index)
          falsy  → no actions                  → Active(next index)

callback.throw(same identity, error)
  notify error(error), release source → Closed(callback-error)
```

Calling is a logical phase around a synchronous call, not a new scheduler or asynchronous effect. There is no production callback interpreter in this checkpoint. The test-only adapter in `tests/helpers/value-driver.mjs` executes callbacks once and supplies their return/throw outcomes. Its try/catch surrounds only the callback; validation failures are not swallowed as callback errors.

The runner still computes each rule's state/action pair once. Guards inspect state, outcome identity and truthiness, never business functions. A supplied outcome is an environment assumption; the model alone does not prove that a particular callback really returned it. Independent tests execute representative callbacks to check that boundary.

## Six-tuple crosswalk

| Component | Value-selection profile |
|---|---|
| S | Unsubscribed, Active(index), Calling(input, callId, next index), Closed(reason) |
| S0 | Fresh Unsubscribed state for each execution |
| Z | subscribe, source next/error/complete, cancel, correlated callback return/throw |
| A | Source acquisition/release, callback invocation, addressed downstream notification |
| T | Lifecycle, counter and pending-call changes |
| G | One ordered action word; filter's dropped-result word is empty |

Map has **seven** rules. Filter has **eight** because callback return splits into pass and drop. The 15 rule IDs are reached through legal event prefixes in model tests. Rule coverage is not an equivalence proof for all possible callbacks and schedules.

## Schema 1.1 and compatibility

The schema adds `CallbackInvocation<Input>` and extends `Action<Output, Input = unknown>`. Notification payloads and callback input types remain distinct. The new action has:

```text
{ type: 'invoke-callback',
  resource: { id: bindingId, generation: invocationIndex },
  value: incomingValue,
  index: invocationIndex }
```

The callback reference is a call identity, not an upstream subscription handle. Its generation and the trace's executionId jointly scope an invocation. A callback resource descriptor records the externally supplied binding; the source resource remains the sole acquired subscription.

A return/throw must name the pending binding and generation. A stale, duplicated or foreign outcome is rejected by the legal-domain model. This is not a claim that RxJS accepts these synthetic event objects or throws the same validation errors.

Existing 1.0 profiles remain valid. Declaring callback actions requires 1.1. `createTakeModel`, its canonical source, and all pre-M02 tests are retained. Three take document projections change only because the shared renderer now uses operator-neutral wording and exposes existing scope/evidence metadata. Its executable semantics, JSON manifest, BDD and predicted trace do not change.

## Lifecycle, time and sharing

Initialization requests source subscription and sets index zero. Source complete/error bypass the callback. Callback throws preserve the thrown value, send an error, and release upstream. Cancellation releases upstream without completing. Closed executions have no admissible inputs.

No timer is scheduled. Traces get timestamps from their inputs; invocation and outcome use separate sequence numbers even at one virtual frame. The test adapter resolves each call before the next external event, without installing a FIFO queue that could change RxJS reentrant behavior.

Each result subscription owns its counter even when the producer is hot. No share or replay policy is added. Callback closures can own external mutable state; the model does not claim to reset or duplicate that state.

## Scope and exclusions

The supported profile uses valid synchronous callbacks, no deprecated thisArg binding, no nested source/observer/callback delivery, no cancellation inside callbacks or notification delivery, and nonthrowing observers/finalizers. A completed return/throw must precede another external input. Source notifications, completion, errors and cancellation during Calling are excluded as reentrant interleavings, not silently queued.

Indices stay within the safe-integer domain. An Active index at MAX_SAFE_INTEGER can terminate but cannot accept another next within this profile. This is a modeling limit, not an assertion that RxJS rejects long streams.

Filter models actual JavaScript truthiness for callback outcomes, although the ordinary TypeScript predicate signature is boolean. Type-guard narrowing, DOM-specific exotic falsy objects, invalid callback arguments and TypeScript proof obligations are not established by these finite tests. Map can return undefined, objects, functions or Observable values; no package contents are inspected by its forwarding rule.

## One model, eight projections per operator

| View | Map | Filter |
|---|---|---|
| Plain-language page | [map](../operators/map.md) | [filter](../operators/filter.md) |
| BDD | [map](../generated/map.bdd.md) | [filter](../generated/filter.bdd.md) |
| State transition table | [map](../generated/map.stt.md) | [filter](../generated/filter.stt.md) |
| State diagram | [map](../generated/map.diagram.md) | [filter](../generated/filter.diagram.md) |
| Test obligations | [map](../generated/map.obligations.md) | [filter](../generated/filter.obligations.md) |
| Four-lane trace | [map](../generated/map.trace.md) | [filter](../generated/filter.trace.md) |
| JSON manifest | [map](../generated/map.manifest.json) | [filter](../generated/filter.manifest.json) |
| JSON trace | [map](../generated/map.trace.json) | [filter](../generated/filter.trace.json) |

The registry in `scripts/generate.mjs` generates all 24 views, including take. Obligation rendering now reads test paths from each model's metadata, rather than hard-coding M01. Syntax checks discover all JavaScript test/helper/generator modules. No dependencies or lockfile entries were added.

Annotations remain authored, reviewed English beside executable rules, not proofs inferred from function bodies. The generated JSON manifest is descriptive; no arbitrary-code loader or standard JSON Schema validator is provided. Example payloads are JSON-safe; lossless serialization of arbitrary JavaScript values remains out of scope.

## Verification

31 new pure-model tests check literal reactions, 15-rule reachability, callback correlation, index advancement, payload identity, lifecycle, schema compatibility, conflicting guards and deliberately corrupted invocation multiplicity. Eight new negative type assertions check input/output separation and invocation shapes.

23 new RxJS test cases cover laziness, indices, return values, callback/source errors, cancellation, subscription independence, synchronous producer shutdown, map's non-flattening behavior, predicate truthiness and pipeline interactions. One case performs **1,302** differential scenarios:

```text
7 callback profiles × 31 binary words of length 0..4
× 3 endings (complete / error / cancel)
× 2 schedules (spaced / same frame)
= 1302
```

Each comparison includes callback value/index observations, downstream notifications and source acquisition/release, in their observed order and virtual times. The comparison domain uses deterministic callbacks; stateful callbacks need fresh equivalent closures for independent observations. Literal examples supplement the model comparison to reduce shared-oracle risk.

The prior 65 named tests and 465 take comparisons remain in the full command. Expected combined count: **119 named tests**. Actual execution status belongs in the evidence record, not in the expectation.

```sh
npm ci --ignore-scripts
npm run check
npm run test:model
npm run generate
npm run check:generated
```

## Primary sources

- [map callback and index](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/map.ts)
- [filter callback, truthiness and index](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/filter.ts)
- [OperatorSubscriber callback exception routing](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)
- [Subscriber terminal lifecycle](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)

The imported discussion's value-selection intuition is retained as provenance in the earlier review. Index-aware, callback-separated profiles are this project's source-checked refinement, not a verbatim import or a proof of the supplied universal wrappers.
