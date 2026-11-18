# Session 20: scenarios, rule witnesses and evidence boundaries

This document maps the five Session 20 operators to their canonical rules and independent RxJS observations. Read it after the [Intuition → Specification → Verification guide](SESSION-20-TERMINAL-TAP-THROTTLE.md). The baseline is RxJS **7.8.2**, source revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). Actual command outcomes, tested commits and acceptance are recorded separately in [Session 20 evidence](../evidence/SESSION-20.md).

## What each evidence layer establishes

| Layer | Source | What it checks | What it does not establish |
|---|---|---|---|
| Source/spec inspection | Pinned implementation and upstream spec links below | Implementation branches, cleanup ordering and upstream scenario intent. | That the upstream test suite was executed here. |
| Canonical model tests | [session20-model.test.mjs](../tests/session20-model.test.mjs), 56 tests | Legal transitions, rejection of selected illegal inputs, state invariants, action order, configured metadata and finite rule witnesses. | Agreement with RxJS merely because generated expectations match their own model. |
| Native RxJS tests | [session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs), 47 tests | Independent literal expectations for actual notifications, identity, virtual time, acquisition and teardown. This file imports no canonical model. | All parameter values, arbitrary callbacks/schedulers or all legal histories. |
| Differential comparisons | [session20-differential.test.mjs](../tests/session20-differential.test.mjs), 3 tests containing 1,062 comparison executions | Actual RxJS actions against predicted model actions for bounded external command sets. | Exhaustive or infinite-trace equivalence; a distinct history for every parameter combination. |
| Static type rejection | [types/session20.ts](../tests/types/session20.ts), 23 `@ts-expect-error` assertions | Selected malformed state/event/configuration programs must fail the TypeScript checker. | Runtime validation of every JavaScript input or semantic correctness. |
| Artifact integration tests | [session20-artifacts.test.mjs](../tests/session20-artifacts.test.mjs), 2 tests | Exact grouping of 14 profiles under five eleven-step indexes, correct model/evidence associations and nonempty local navigation targets. | Native equivalence or byte-for-byte regeneration, which has its own check. |
| Generated projections | [five operator indexes](#configured-projections) | Eight consistent views per configured profile and navigation to source/evidence. | Independent execution evidence; generated traces are predictions. |

The runtime test inventory is **56 + 47 + 3 + 2 = 108 Session 20 tests**. The 23 type assertions are compiler checks, not another 23 runtime tests. A successful test title is evidence only when paired with an executed result in the ledger.

## Rule notation

All full rule identifiers begin `S20-<OPERATOR>-`, with the operator uppercased; for example `S20-TAKELAST-COMPLETE-FLUSH` or `S20-THROTTLETIME-WAIT-END`. Tables below give their suffixes within the named operator. A slash groups related rules rather than inventing one combined identifier. `N(v)`, `E(e)` and `C` denote downstream next, error and complete. “Release” denotes the observed subscription/timer teardown action under the documented nonreentrant scope.

**Obligation IDs and test names are distinct.** Session 20 generated obligation entries contain canonical rule IDs, not literal `node:test` titles. Every retained rule ID for a configured profile maps to the named model test `S20 REACHABILITY <metadata.id>: every retained rule has a legal prefix`, which asserts equality between witnessed and declared rule-ID sets. The scenario tables supply the behavioral mapping to native tests. This is a documented mapping, not a generated assertion that each ID occurs as a native test title; the generic obligations-page wording must be read with this distinction.

The following named test entry points make that mapping inspectable. Braced placeholders indicate the exact titles expanded by loops in the linked test files.

| Rule group / obligation | Named test entry point |
|---|---|
| Every retained rule in each configured profile | Model: `S20 REACHABILITY {metadata.id}: every retained rule has a legal prefix`. |
| `TAKELAST` append/replace/flush | Native: `S20 RX takeLast: suffix is silent until completion, then FIFO next/next/complete before teardown`. |
| `TAKELAST` nonpositive initialization | Native: `S20 RX takeLast({count}): no producer acquisition`, count −8 or 0. |
| `TAKELAST` error / cancel | Native: `S20 RX takeLast: error preserves identity and discards the entire suffix`; `S20 RX takeLast: early cancellation is silent and does not flush`. |
| `TAP` start / next / successful complete | Native: `S20 RX tap: subscribe hook precedes acquisition; next and complete hooks precede unchanged notifications`. |
| `TAP` notification-hook throws | Native: `S20 RX tap: throwing {hook} handler replaces the notification and has distinct lifecycle flags`, hook next/error/complete. |
| `TAP` source error / cancellation | Native: `S20 RX tap: source error skips unsubscribe hook but always finalizes after source teardown`; `S20 RX tap: explicit cancellation calls unsubscribe before finalize, exactly once`. |
| `THROTTLE` four flags / completion waiting | Native: `S20 RX throttle {flags}: burst and source completion`, flags 10/11/01/00. |
| `THROTTLE` trailing restart / empty duration | Native: `S20 RX throttle: trailing output restarts duration with latest emitted payload, then empty window goes idle`; `S20 RX throttle: completed duration is not a trailing next signal`. |
| `THROTTLE` Waiting + empty completion | Native: `S20 RX throttle: duration complete while waiting discards pending value, completion before final duration teardown`. |
| `THROTTLE` error and resource lifetime paths | Differential: `S20 DIFF throttle: 720 bounded external schedules compare selector calls, source/duration lifetimes and output order`; focused native fixtures appear in the throttle table below. |
| `THROTTLETIME` four flags | Native: `S20 RX throttleTime {flags}: independent virtual-time golden history`, flags 10/11/01/00. |
| `THROTTLETIME` clock/generation guard | Model: `S20 throttleTime: late timer output uses supplied time; stale, early and inconsistent clock events fail`. |
| `THROWIFEMPTY` empty/factory return | Native: `S20 RX throwIfEmpty: factory is lazy, called once at empty completion, and preserves returned error identity`. |
| `THROWIFEMPTY` factory throw / bypass | Native: `S20 RX throwIfEmpty: thrown factory value also reaches error by exact identity`; `S20 RX throwIfEmpty: failed or cancelled source bypasses the factory`. |

The configured metadata IDs used by rule-witness titles are `takeLast-2`, `takeLast-0`, `tap-subscribe-next-error-complete-unsubscribe-finalize`, `tap-next`, `throwIfEmpty-default`, `throwIfEmpty-custom`, `throttle-{10,11,01,00}`, and `throttleTime-{10,11,01,00}-4`. Full-action differential comparisons supplement these named scenario entry points; neither their names nor this table claim exhaustive runtime rule coverage.

## `takeLast` scenarios

Pinned basis: [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeLast.ts), [upstream specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/takeLast-spec.ts), [canonical model](../src/models/session20-terminal.ts).

| Given / when | Then: modeled rule and independently observed behavior |
|---|---|
| Positive count; subscribe before any source event | `START`: acquire source, with fresh empty FIFO and no downstream value. |
| Count 2; source supplies A, B, C | `APPEND`, then `REPLACE-OLDEST`: source remains silent downstream while B and C become the retained suffix. Model checks original references and immutable state updates. |
| The same source completes successfully | `COMPLETE-FLUSH`: `N(B), N(C), C`, then source teardown. Native test asserts this full order and a separate literal marble/source-subscription interval. |
| Fewer than count values, or no values, then complete | `COMPLETE-FLUSH`: emit all retained values or none, then complete. Native short/empty fixtures use count 4. |
| Count 0 or a negative configured count | `START-EMPTY`: complete without any producer acquisition. Model checks −8, −1 and 0; native fixtures check −8 and 0. |
| A retained suffix exists and the source fails | `ERROR`: forward the original error object, release source, and emit none of the suffix. |
| A retained suffix exists and the consumer cancels | `CANCEL`: release source silently. A later source completion cannot flush it. |
| Two result subscriptions start at different times on the same live Subject | Each connection retains its own suffix. Native observations preserve opaque object identity and show no implicit replay into the later connection. |
| Invalid count, oversized FIFO, or unsupported state/event pair | Model validation rejects the selected invalid cases; the parameter bound is explicit. |

The upstream spec bodies include retained suffixes, short/empty/never sources, nonpositive counts, failure and unsubscription. A misleading upstream test title mentioning an error on empty is not taken literally: its body expects successful completion. The local tests follow the actual expectation and pinned implementation.

**Separate runtime characterization:** `of(1,2,3).pipe(takeLast(3),take(1))` produces only the first flushed value downstream. This observes cancellation within synchronous flushing; the canonical completion-flush action word remains atomic and does not claim to model that interleaving.

## `tap` scenarios

Pinned basis: [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/tap.ts), [upstream specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/tap-spec.ts), [OperatorSubscriber](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts), [canonical model](../src/models/session20-tap.ts).

| Given / when | Then: rule and independently observed behavior |
|---|---|
| A pipeline is constructed, then subscribed | `START`: construction is silent; configured subscribe hook runs before source acquisition. |
| Configured next hook returns successfully | `NEXT-CALL`, `NEXT-RETURN`: invoke hook before forwarding the same value reference. Returned replacement values are ignored. |
| Configured error or complete hook returns successfully | `ERROR-CALL`/`COMPLETE-CALL`, then corresponding `RETURN`: forward original terminal, release source, finalize; do not call unsubscribe hook. |
| Next hook throws | `NEXT-THROW`: pending value is replaced by exact thrown error; source teardown precedes unsubscribe hook, which precedes finalize. |
| Error or complete hook throws | `ERROR-THROW`/`COMPLETE-THROW`: replace the original terminal with exact thrown error; teardown then finalize, with no unsubscribe hook. |
| Matching notification hook is absent | `NEXT-PASS`/`ERROR-PASS`/`COMPLETE-PASS`: pass the unchanged notification; apply terminal cleanup when appropriate. |
| Consumer cancels between notifications | `CANCEL`: source teardown, unsubscribe hook, finalize; no downstream terminal. Repeated native unsubscription does not run lifecycle hooks twice. |
| Callback outcome has the wrong invocation generation, or a source next arrives while Calling | The selected illegal transition is rejected. Duplicate hook configuration is also rejected. |

The upstream spec bodies cover unchanged delivery, all three throwing notification hooks, early cancellation, and lifecycle distinctions between complete, error and unsubscribe. Local native fixtures additionally assert source teardown position and exact thrown-object identity. Lifecycle hooks are nonthrowing in the canonical profile; the notification callback outcome must be supplied at invocation time. The generic trace runner does not enforce that envelope-time equality for `tap`; the differential harness supplies it.

**Separate runtime/API characterization:** no-handler `tap()` preserves source Observable identity. A cooperative synchronous producer checks its subscriber's closed flag and stops after downstream `take(2)`. These tests do not broaden the canonical model to source delivery during acquisition, callback-driven cancellation, receiver binding or arbitrary reentrancy.

## `throttle` and `throttleTime` scenarios

Pinned basis: [throttle implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttle.ts), [throttle specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throttle-spec.ts), [throttleTime implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttleTime.ts), [throttleTime specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throttleTime-spec.ts), [timer implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/timer.ts), [canonical models](../src/models/session20-throttle.ts).

Both families have four tested flag combinations: **10** (leading only), **11** (leading and trailing), **01** (trailing only), and **00** (no next values). The canonical example supplies A at 1, B at 2, source complete at 3, and duration next/timer fire at 5. Its expected outputs are A1/C3, A1/B5/C5, B5/C5, and C3 respectively. The native timed golden history independently uses A1/B2/C3 with source completion at 4, and therefore emits the latest **C** at 5 for trailing profiles. These are different fixtures exercising the same policy.

| Given / when | Rules and observed obligations |
|---|---|
| Subscribe to an empty or silent source | `START`, and `COMPLETE-OPEN` if it completes: acquire source but never invoke selector/schedule a timer without a source value. |
| First value arrives while Open | `OPEN-NEXT`: emit it iff leading; begin a fresh duration regardless of the flag. Signal `SELECTOR-RETURN` acquires its returned Observable. |
| Selector throws while starting a duration | Signal `SELECTOR-THROW`: exact error follows any already-delivered leading value; source is released and no duration is acquired. |
| New values arrive while a duration is active | `REMEMBER`: keep newest reference and the same duration generation/deadline. No extra selector call or reschedule. |
| Current duration next/timer fire arrives with a pending trailing value and live source | `END-EMIT-RESTART`: release old gate, emit newest value, then begin another duration. Signal selector receives the emitted trailing value as its argument. |
| Current duration next/timer fire arrives with no pending trailing value | `END-OPEN`: release gate, emit nothing and go idle. With trailing disabled, retained internal memory is not output. |
| Signal duration completes without next while source is live | `DURATION-EMPTY`: release gate and reopen without flushing. Model explicitly checks that internal presence/reference can remain; later source completion in Open discards it. |
| Source completes with trailing enabled, pending value and active gate | `COMPLETE-WAIT`: release source immediately; retain duration and pending value. Source completion itself does not flush. |
| Current duration next/timer fire arrives while Waiting | `WAIT-END`: release duration, emit pending value, complete. No new selector invocation or timer is allowed. |
| Signal duration completes without next while Waiting | `WAIT-EMPTY`: complete without a pending value delivery, then release that duration. Native fixture checks completion before duration finalization. |
| Source completes without a pending trailing value, or trailing is disabled | `COMPLETE-NOW` or `COMPLETE-OPEN`: complete immediately. A lone leading value with flags 11 does not force a wait. |
| Source fails while Open or Throttled | `SOURCE-ERROR-OPEN`/`SOURCE-ERROR-THROTTLED`: forward exact error, release owned resources and discard pending memory. |
| Current signal duration fails while source live or while Waiting | `DURATION-ERROR-THROTTLED`/`DURATION-ERROR-WAITING`: error immediately, preserving identity. Release source only if still owned, then duration. |
| Consumer cancels while Open, Throttled or Waiting | Corresponding `CANCEL-*`: release remaining resources silently. Waiting has no live source left to release again. |
| An old signal duration tries to send again after a restart | Native closed subscription cannot affect the new gate; model generation checks reject a stale event. |
| Timer due at 15 arrives at 20, duration 4 | Current `END-EMIT-RESTART` emits at supplied time 20 and schedules due 24. Early, stale or inconsistent envelope/event time is rejected in the model. |

The pinned upstream throttle specs inspect duration-subscription intervals, leading/trailing policies, waiting beyond source completion, selector/duration errors and unsubscription chains. The timed specs inspect both explicit trailing configurations, individual values and successful/error termination. The local 00 profiles and empty-duration cleanup-order assertions are grounded in the pinned implementation and independent native fixtures, not attributed to nonexistent upstream cases.

**Separate runtime characterization:** signal throttle with a synchronous one-value source and synchronous one-value duration can deliver its trailing value and complete during acquisition. A zero-duration timer on a deferred virtual scheduler can also deliver a pending latest value. These observations do not admit synchronous acquisition or zero duration into the declared canonical profiles.

## `throwIfEmpty` scenarios

Pinned basis: [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throwIfEmpty.ts), [upstream specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throwIfEmpty-spec.ts), [canonical model](../src/models/session20-terminal.ts).

| Given / when | Rules and observed obligations |
|---|---|
| Construct then subscribe | `START`: fresh `hasValue=false`; factory remains uncalled. |
| Source next is any value, including undefined/null | `NEXT`: set presence true and forward the exact payload. Presence is not a truthiness check. |
| Nonempty source completes | `COMPLETE-NONEMPTY`: complete and release source without invoking factory. |
| Empty source completes and custom factory returns | `COMPLETE-EMPTY`, `FACTORY-RETURN`: request exactly once at completion, emit returned value on the error channel, release source. |
| Custom factory throws | `FACTORY-THROW`: preserve exact thrown value as the downstream error. |
| Custom factory returns undefined | `FACTORY-RETURN`: `E(undefined)` is a real error notification. |
| Default binding sees empty completion | Native fixture checks actual `EmptyError` instances and that two subscriptions receive different instances. The canonical default outcome assumes that pinned factory result; it does not construct the class. |
| Source fails or consumer cancels before completion | `SOURCE-ERROR`/`CANCEL`: factory remains uncalled; error identity or cancellation silence is preserved. |
| Two result subscriptions start at different points on the same Subject | Presence resets for each connection. A later subscription can fail as empty even if an earlier subscription received a value. |
| Factory outcome uses a stale invocation or claims a throw from default binding | Model rejects the selected invalid outcome. Same-time synchronous return remains a caller precondition for generic `runTrace`. |

Upstream bodies cover custom/default factory behavior, error identity, nonempty passthrough, never sources and fresh presence on retry. Local native fixtures add explicit cancellation bypass, exact thrown identity, fresh default error instances and undefined/null distinctions. The default generated example is a nonempty A → complete path; only the custom generated example supplies an explicit returned error token.

## Bounded differential comparison design

The native adapters execute real RxJS and record what it does. They do not call model transitions to decide the expected native behavior. They then feed the same accepted external events and actual opaque callback outcomes to the model and compare ordered timestamped action words. Source acquisition/teardown, callback calls and duration/timer lifetimes matter as well as output values.

| Comparison group | Parameter space and count | Observation boundary |
|---|---|---|
| Terminal and tap | Six value words × three endings (complete/error/cancel) × eleven configurations: five `takeLast` counts, two custom-factory outcomes, four tap throw choices. **198 executions.** | Compare source lifetime, original values/errors, callback invocation order, downstream notifications and teardown. Value words include undefined, null and repeated object references. |
| Signal throttle | Four flag profiles × (five prefixes × four next commands × eight endings + five selector-failure schedules × four throwing-generation choices). **720 executions.** | Observe selector arguments, duration generations, current versus closed subscriptions, source/duration lifetime and ordered output. Commands directed at already closed producers are ignored by the native harness and are not presented as legal model events. |
| Timed throttle | Four flag profiles × three durations (1, 2, 4) × three endings × four source-time lists. **144 executions.** | Subscription starts at virtual frame 2. Instrumented scheduler records native allocation, delivery and cancellation. Each instrumented native output is also checked against an uninstrumented TestScheduler run with the same schedule. |

Total: **1,062 finite comparison executions** inside three tests. Some configurations collapse to the same accepted history, or never reach their selected throwing generation. The count is neither a count of distinct histories nor an exhaustive enumeration. The second, uninstrumented timed run is a check on observation transparency, not another 144 model/native comparisons. The finite horizon and chosen event order do not imply all schedulers, all same-time orderings or all infinite streams behave equivalently.

## Finite rule-reachability witnesses

Each of the 14 configured models has a test named `S20 REACHABILITY <profile>: every retained rule has a legal prefix`. Its breadth-first exploration starts from `initialState()`, deduplicates concrete JSON-encoded model states, and offers a small state-specific candidate alphabet. Representative values/errors are `V`/`E`; a duration description uses token `D`. Only the current generation and its legal correlated callback/duration events are offered.

The search processes queued states at depth **at most 9** and only enqueues successor states whose invocation and next-generation counters are **at most 3**. Outgoing transitions from an accepted depth-9 state are still inspected, so “depth 9” is a bound on explored state prefixes, not a claim that every observed edge lies inside a nine-event trace. Likewise, an outgoing transition can advance a counter beyond 3 without enqueuing that successor. The test compares the set of witnessed rule IDs with all rules retained by that configured model.

This supplies a finite legal prefix witnessing every retained rule for those configurations. It does **not** enumerate every possible state or payload, every guard boundary, every word over the event alphabet, or all RxJS behavior. Runtime equivalence is a different claim addressed only by the bounded independent tests above. Absent rules are deliberate: nonpositive `takeLast` has no collecting rules, flags without trailing have no Waiting rules, and timed profiles have no selector or signal-duration rules.

## Static rejection coverage

The 23 negative assertions group into six `takeLast` configuration/state/payload checks, three factory-binding/outcome checks, five `tap` hook/state/correlation checks, and nine throttle flag/duration/time/resource/payload/state checks. They cover required FIFO/pending/gate fields, correctly typed values, numeric generations, a required error field even when its value may be undefined, selector return tokens, mandatory event time, and the closed-state reason union. Runtime domain guards additionally handle finite count/duration bounds, valid times and current-generation legality.

## Configured projections

| Export-level index | Profile stems |
|---|---|
| [takeLast](../operators/takeLast-index.md) | `takeLast` (count 2), `takeLast-zero` (count 0). |
| [tap](../operators/tap-index.md) | `tap` (all hooks), `tap-next` (next only). |
| [throttle](../operators/throttle-index.md) | `throttle` (10), `throttle-leading-trailing` (11), `throttle-trailing` (01), `throttle-silent` (00). |
| [throttleTime](../operators/throttleTime-index.md) | `throttleTime` (10), `throttleTime-leading-trailing` (11), `throttleTime-trailing` (01), `throttleTime-silent` (00); duration 4. |
| [throwIfEmpty](../operators/throwIfEmpty-index.md) | `throwIfEmpty` (default binding), `throwIfEmpty-custom`. |

Fourteen profiles × eight views plus five indexes gives **117 Session 20 projection files**. Regeneration checks establish consistency with the canonical rules and examples, not native equivalence. The indexes expose the required eleven-step route through behavior, diagram, STT, BDD, trace, obligations, manifest, canonical model, pinned implementation, tests and evidence.

## Historical CI boundary

The already completed [GitHub Actions run 44038936671](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44038936671), [job 133888520844](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44038936671/job/133888520844), reported **1,414 passing repository tests** and printed the **198/720/144** comparison counts. Its generated-file check covered the earlier **887 ordinary plus three specialized `mergeWith` projections**. Session 20 generator registration and its 117 projection files were absent from that run. It therefore supports the earlier model/test revision, not completion of the later integration. Consult the evidence ledger for subsequent checks and exact revision attribution; do not infer final acceptance from that historical green run.
