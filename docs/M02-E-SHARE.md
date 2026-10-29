# M02-E — share as a shared connection machine

**Baseline:** RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Canonical model:** [src/models/share.ts](../src/models/share.ts).
**Evidence:** [Session 2](../evidence/SESSION-02.md).

## Intuition

The first subscriber opens a source connection. Other subscribers join that connection and receive future values. When a subscriber leaves, only that subscriber leaves unless it was the last one and the reset policy requests disconnection. Completion and error terminate the current subscribers; reset policies decide what a later subscriber encounters.

This state belongs to the **resulting shared Observable**, not separately to every observer and not globally to a reusable `share()` operator function. Source connection generations live inside that longer-lived coordinator. Sharing is explicit here; no replay is added.

## Scope and Cω-style shape

```text
share : T* -> Shared(T*)
```

`Shared` is project teaching notation for ownership and connection policy, not original Cω syntax. Each subscriber observes values that arrive during its own active subscription, possibly fewer than the source's total values. Addressed broadcasts can produce many observer deliveries per source value without manufacturing new payloads.

The profile uses the default Subject connector and **boolean** resetOnError, resetOnComplete and resetOnRefCountZero. All eight combinations are tested. The generated profile uses the default true/true/true configuration. Custom connectors, replay, notifier-based delayed resets, callback reentry and throwing observer/finalizer behavior are excluded. Synchronous production is characterized in separate native tests; exact teardown traces use post-setup delivery.

## Six-tuple

| Component | This operator's specification |
|---|---|
| S | Disconnected; Connected(connection generation, ordered subscribers); retained Completed or Errored(error); next-generation and unique-subscription-ID bookkeeping |
| S0 | Disconnected, generation counter zero, no used subscription occurrences |
| Z | Subscriber join/leave; current-source next/error/complete, with explicit source generation |
| A | Acquire/release a source connection; addressed next/error/complete notifications |
| T | Register/remove a subscriber; connect/reset; retain terminal state according to configuration |
| G | Broadcast in registration order, disconnect on configured last departure, or immediately send a retained terminal to a late subscriber |

The existing schema already has addressed notifications. It therefore supports this model without adding new action tags or changing prior operators. The state is symbolic: subscriber registries, payloads, errors and generations are not a small finite state space.

The default profile has seven rules. Disabling terminal resets adds late-subscription rules, so a retain-both profile has nine. Completed/Errored controls are not absorbing terminal states of the coordinator: the source execution is terminated, but new subscriber events remain legal.

## State-dependent legal behavior

```text
Behavior : (state : S) -> (event : E state)
        -> Σ (nextState : S). Actions state event nextState
```

The constraints apply to entire reactions, not only to a state object's shape:

- A first join must use a fresh subscription-occurrence ID and allocate a fresh source generation. A live join must not allocate another connection or replay past values.
- A source notification must name the current connection. No disconnected or obsolete source generation may drive the model.
- A leave must name an active subscriber. It cannot emit completion. A nonfinal leave cannot disconnect the source.
- A source terminal delivers exactly one addressed terminal to each current subscriber, removes all live subscribers and releases the source. The configured reset selects Disconnected versus retained terminal state.
- A late join to retained terminal state receives only that terminal; it neither remains registered nor opens a source connection.

IDs denote individual subscription occurrences, not reusable observer labels. The `used` set enforces this legal-domain convention. Actual RxJS repeated unsubscribe is idempotent; the model only admits a leave from an active subscription. Stale actual producer attempts are stopped at closed subscribers, not turned into a public model-validation API.

The constraints are encoded with discriminated unions, guards, reaction validation and tests. They are not a machine-checked dependent-type proof of the library.

## Reset policies

| Setting | true | false |
|---|---|---|
| resetOnRefCountZero | Last live departure disconnects and resets | Keep source connected with zero listeners |
| resetOnComplete | A later subscriber can start a fresh source execution | Retain completion and immediately complete late subscribers |
| resetOnError | A later subscriber can start a fresh source execution | Retain the exact error for late subscribers |

A reset is **not a retry for existing subscribers**. They already received their terminal event. Only a later new subscription can connect again. If a connection is retained without listeners, source values are not buffered by share and will not be replayed when somebody rejoins.

## Named rules and generated artifacts

For example, SHARE-LAST-RESET reads:

```text
Given Connected with exactly one registered subscriber
When that subscriber unsubscribes and resetOnRefCountZero is true
Then unsubscribe the source
And Disconnected, ready for a later fresh connection
```

That rule connects the model, [BDD](../generated/share.bdd.md), [STT](../generated/share.stt.md), [state diagram](../generated/share.diagram.md), [obligations](../generated/share.obligations.md) and [readable page](../operators/share.md). The [manifest](../generated/share.manifest.json) is descriptive JSON without executable function bodies.

The [JSON trace](../generated/share.trace.json) and [four-lane trace](../generated/share.trace.md) show two observers sharing generation 0, its last departure, a new connection, completion/reset, and an error/reset of another connection. Their addressed output lane keeps the subscriber name visible. These are model predictions, not recordings of native execution.

## Time, cancellation and ownership

share creates no clock or timer. The event sequence supplies ordering, including which subscribers exist when a value arrives. Cancellation is a subscriber-specific lifecycle event; it is never shorthand for source completion. One shared source may outlive a particular observer or, with resets disabled, all observers.

The model commits registry/reset state before interpreting its ordered action word. Reentrant subscription during broadcast or terminal handling is outside this atomic profile. Exact source release after terminal broadcasts is asserted for post-setup source notifications only. A production interpreter for these action records remains future work.

## Verification

Forty model tests exercise all eight reset combinations, legal rule reachability, payload/error identity, source generations, subscription occurrence identity, empty registries, corrupted broadcasts and generated-example consistency.

Native tests check lazy connection, overlapping subscriptions, no replay, registration order, last-subscriber behavior, resets versus terminal retention, obsolete producer attempts, instance ownership, synchronous sources and subscription marbles.

The bounded differential test covers every word of length 0..4 over join/leave/next/complete/error for all eight configurations:

```text
8 × (1 + 5 + 25 + 125 + 625) = 6248 scenarios
```

Test commands are supplied at logical step times. Attempts to leave with no live subscriber, or emit when no source exists, produce no input to either live machine. At the end, explicit external cleanup removes remaining subscribers and completes any retained connection. That cleanup is not invented automatic operator behavior.

The native observer uses actual RxJS and does not import the model. Comparison includes addressed notifications and source generation/acquisition/release order. These finite checks do not prove arbitrary configurations, notifier timing or reentrant equivalence. The retrieved CI evidence, not the number of authored tests, decides acceptance.

## Pinned primary source

[share.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/share.ts), with Subject, Subscriber and Subscription at the same revision. The imported document's subscriber-addressed-output idea is retained as inspiration; boolean reset rules are checked against these pinned sources and runtime observations.
