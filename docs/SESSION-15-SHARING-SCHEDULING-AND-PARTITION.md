# Session 15 — Merge, multicast, scheduling, error-resume, and partitioned routing

**12 November 2026 · Europe/Zurich · pinned RxJS 7.8.2**  
Source revision: [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

Exactly five distinct export names: `mergeWith`, `multicast`, `observeOn`, `onErrorResumeNext`, `partition`. The names are not interchangeable. The canonical model files are `src/models/session15-aliases.ts`, `src/models/session15-observeOn.ts`, `src/models/session15-onErrorResumeNext.ts`, and `src/models/session15-partition.ts`. Every public export has one generated eleven-step inspection index, covering Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Mealy Model, pinned source, tests and evidence.

## Intuition: which values move over time?

| Operator | Incoming | Behavioral decision | Result |
|---|---|---|---|
| `mergeWith(...others)` | Original source and any other Observables | Listen to all; do not inspect payloads; allow overlap without a concurrency argument | Interleaved values, first error or all-completed terminal |
| `multicast(factory, selector)` | One original source, a factory-produced Subject and selected branches | Register two selected subscribers **before** connecting the source | Two deliveries per value from one shared source connection |
| `observeOn(scheduler, delay)` | Source next, complete and error notifications | Place each notification on a distinct scheduled action | Original values and terminals delivered by the supplied scheduler |
| `onErrorResumeNext(...others)` | One active stream and a queue of later streams | On complete **or** error, drop the terminal and move to the next input | All successfully delivered nexts, then normal completion |
| `partition(predicate)` | Source used by two separately constructed `filter` outputs | Invoke the indexed predicate independently in each subscribed branch | `[passed$, failed$]` — two Observables, **not** one shared router |

A source controls the arrival time; a scheduler (when requested) controls rescheduled delivery. The models never manufacture domain values. Callback requests and callback outcomes are separate events.

## Six-tuples and guarded legal behavior

Every model uses `M = (S, S₀, Z, A, T, G)` with `T : S × Z → S`, `G : S × Z → A*`, and an explicit guard for each legal state/event pair. An illegal event must be rejected; absence of an enabled guard is not permission to ignore that event. `G` is an **ordered action word** containing subscriptions, unsubscriptions, schedules, callback requests and downstream notifications.

### 1. mergeWith

- **Cω:** `T₀* × … × Tₙ* → (T₀ | … | Tₙ)*`; next count is the sum of emitted input nexts before early error/cancel, not the count of original source nexts.
- **S, S₀:** Unsubscribed; Active(live, pending, total); Closed(reason). Start Unsubscribed.
- **Z:** subscribe, input.next(i,v), input.complete(i), input.error(i,e), cancel.
- **A:** subscribe/unsubscribe numbered inputs, output next/complete/error.
- **T/G:** INIT subscribes input 0 first and all remaining inputs immediately; NEXT forwards an opaque value; COMPLETE-WAIT removes a finished input; COMPLETE-LAST completes when the final live input ends; ERROR propagates exact error and releases all; CANCEL releases all silently.
- **Legality:** only a live, already subscribed source may notify. The `mergeWith` export delegates to deprecated pipeable `merge` but passes no concurrency argument, so **unbounded concurrency** is enforced. There is no `mergeWith` scheduling or queue profile.
- **Time/ownership/sharing:** input order on initial subscription is deterministic; next arrival order is external. Each output subscriber independently subscribes to all sources; no new sharing.

### 2. multicast

- **Cω:** for the modeled `multicast(() => new Subject(), shared => merge(shared,shared))` witness, `T* → (T+T)*`; each source next leads to two output nexts after the selected subscriptions are ready.
- **S, S₀:** Unsubscribed, Preparing, Active, Closed(reason); start Unsubscribed.
- **Z:** subscribe, selector.return/throw, source.next/complete/error, cancel.
- **A:** callback invocation, subscribe selected, subscribe original, two output nexts, result terminal, release.
- **T/G:** INIT creates fresh factory-selected Subject and requests the selector; SELECTOR-READY subscribes selected result **before source**; BROADCAST duplicates each original next to the two branches without copying payload; source terminal and cancellation release subscriptions. A selector throw ends without starting the source.
- **Legality:** source.next cannot occur before selected output setup. This is **only** the factory-plus-selector overload. Other valid exports — fixed Subject identity and selector-less `ConnectableObservable.connect/refCount` — require different state and are explicitly excluded. It would be incorrect to treat `multicast` as merely allocating a Subject.
- **Time/ownership/sharing:** external source emits at its own time, even synchronously after setup. One source connection is shared within each selected-result subscription. A fresh factory means no cross-result sharing.

### 3. observeOn

- **Cω:** `T* → T*`, with a separate scheduled output for each source next **and source terminal**; the output preserves payload identity unless cancelled before delivery.
- **S, S₀:** Unsubscribed, Active(sourceLive, FIFO queue of `{token, kind, due}`, lastSourceTime), Closed(reason); start Unsubscribed.
- **Z:** subscribe, source.next(v,now), source.complete(now), source.error(e,now), timer.fire(token,now), cancel.
- **A:** subscribe source, schedule(token,delay), downstream next/complete/error on fire, cancel timer/release source.
- **T/G:** QUEUE-NEXT, QUEUE-COMPLETE and QUEUE-ERROR create independent scheduled actions; no immediate downstream output. FIRE-NEXT releases only the head queued value. FIRE-COMPLETE/FIRE-ERROR release matching terminal at its due time. CANCEL clears pending tasks silently. Source errors and completion are both delayed; this is an important semantic difference from `delay`.
- **Legality:** a timer may fire only for the **head** scheduled token at or after its deadline. A source may not emit after its own terminal. FIFO ties are the selected virtual scheduler profile, not a guarantee for arbitrary schedulers.
- **Time/ownership/sharing:** `due = sourceNow + delay`, but the scheduled event's clock comes from the scheduler. The source's own scheduler is unchanged. Consumer cancellation cancels all owned tasks and the remaining upstream connection.

### 4. onErrorResumeNext

- **Cω:** `T₀* × … × Tₙ* → (T₀ | … | Tₙ)*`; output terminal is normal completion after all inputs finish/fail.
- **S, S₀:** Unsubscribed, Active(current,total), Closed(exhausted/cancel); start Unsubscribed.
- **Z:** subscribe, input.next(i,v), input.complete(i), input.error(i,e), cancel.
- **A:** one numbered input subscription, output next/complete, release current, subscribe next.
- **T/G:** INIT subscribes the piped source; NEXT forwards a value from that exact input. COMPLETE-ADVANCE and ERROR-ADVANCE release current and admit only the next supplied source. COMPLETE-LAST and ERROR-LAST both complete the result normally, swallowing all errors. CANCEL closes without starting any later sources.
- **Legality:** no input may notify before its turn. This export is the deprecated pipeable alias **`onErrorResumeNext === onErrorResumeNextWith`**, not the root creation function, and valid Observable inputs are the declared scope. Exceptions while converting malformed inputs are excluded.
- **Time/ownership/sharing:** a strict serial subscription policy; source timing is not changed. Only one input subscription is held; no automatic sharing.

### 5. partition

- **Cω:** `(T × Index → Bool) × T* → (T*,T*)`; each result subscription has its own stream of predicate outcomes.
- **S, S₀:** Unsubscribed, Active(pass: Slot, fail: Slot), Closed(both-closed); start Unsubscribed. Each Slot has independent `status`, `index` and pending callback.
- **Z:** subscribe both branches (the modeled witness), source.next(branch,v), predicate.return/throw(branch,index), source.complete/error(branch), branch.cancel.
- **A:** subscribe two source executions, request branch-specific indexed predicate, forward a next to **pass** only when true or to **fail** only when false, branch-local terminal and teardown.
- **T/G:** INIT makes two source subscriptions. PREDICATE-REQUEST stores value and increments only that branch's index. PREDICATE-RETURN forwards/discards based on branch and boolean result, then clears pending callback. Complete, error, predicate throw or cancel terminates only the affected branch; the combined model is closed when both are closed.
- **Legality:** a branch cannot receive new source values during an unresolved callback; callback results must match branch and index. Neither branch can notify after termination. **Do not mistake partition for routing each source value once:** `partition` literally constructs two independent `filter` Observables. A cold source runs twice when both are subscribed; the index and predicate invocation count reset separately.
- **Time/ownership/sharing:** independent source subscriptions, independently cancelled. A hot source can happen to be shared *externally*, but `partition` adds no multicast connection itself. The witness models one subscription per returned branch.

## Source inspection and verification architecture

Pinned source files include `src/internal/operators/mergeWith.ts`, `merge.ts`, `multicast.ts`, `connect.ts`, `observeOn.ts`, `src/internal/util/executeSchedule.ts`, `src/internal/operators/onErrorResumeNextWith.ts`, `src/internal/observable/onErrorResumeNext.ts`, `partition.ts`, `filter.ts` and `util/not.ts`. Export identity was confirmed in `src/operators/index.ts`.

`mergeWith` reuses the previously reviewed merge machine and `multicast` reuses the previously reviewed connect selector machine for their **narrow declared profiles**, with distinct export names and rule identities. The remaining three have original guarded canonical rules. The common schema, trace runner, generator, validation and independent native test harness are not replaced. Source errors, time, cancellation, lifetimes and no-sharing or sharing boundaries have distinct explicit obligations.

Generated traces are **model-predicted**; the independent `tests/session15-rxjs.test.mjs` suite observes actual RxJS 7.8.2. The fixed examples and native tests cannot establish unrestricted equivalence over reentrancy, every scheduler or every overloaded argument type. Do not claim acceptance until a tested commit, generated drift check, source comparisons, and retrieved independent read-only CI are recorded in [Session 15 evidence](../evidence/SESSION-15.md).
