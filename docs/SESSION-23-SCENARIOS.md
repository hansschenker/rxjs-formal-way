# Session 23 — Scenario and verification map

The [teaching guide](SESSION-23-ZIP-FAMILY.md) explains positional pairing and connection policies. The [evidence ledger](../evidence/SESSION-23.md) records actual checks, counts, revisions and acceptance. All models target RxJS **7.8.2**, pinned revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

## Behavioral obligations

| Export | Required scenarios | Model checks | Independent runtime observations | Direct comparisons |
|---|---|---|---|---|
| `zip` | Correct pipeable export; source-first acquisition; FIFO pairing under uneven arrival; completed-queue drain; empty completion; errors; silent cancellation; singleton tuples; payload identity and bounded state legality. | [Model tests](../tests/session23-zip-model.test.mjs) | [Native tests](../tests/session23-zip-rxjs.test.mjs) | [Native-first adapter](../tests/session23-zip-differential.test.mjs) |
| `zipAll` | Collect without connecting inners; outer completion barrier; empty outer; duplicate inner descriptions; deferred acquisition order; successful finalization before downstream completion; queued completed inputs; failures and cancellation in both phases. | [Model tests](../tests/session23-zipAll-model.test.mjs) | [Native tests](../tests/session23-zipAll-rxjs.test.mjs) | [Native-first adapter](../tests/session23-zipAll-differential.test.mjs) |
| `zipWith` | Independent public-export evidence for the shared FIFO policy; source and argument ordering; uneven rates; retained completed queues; immediate empty completion; failure; cancellation; independent subscriptions and singleton tuples. | [Model tests](../tests/session23-zipWith-model.test.mjs) | [Native tests](../tests/session23-zipWith-rxjs.test.mjs) | [Native-first adapter](../tests/session23-zipWith-differential.test.mjs) |

The three adapters enumerate **27,168 finite comparison executions**: **7,776 zip**, **9,024 zipAll**, and **10,368 zipWith**. These are executed finite cases, not necessarily unique histories. Model state never decides which actual RxJS subscriber is live. Native adapters retain the actual notification and teardown ordering before replaying the admitted history through the canonical model.

## State and resource contracts

Each direct-family active state has a FIFO per input and a corresponding completion/liveness marker. At least one FIFO is empty between atomic notifications; otherwise another tuple would already have been emitted. A completed empty FIFO requires termination. Input values are kept by identity and consumed at most once into a tuple.

The `zipAll` collecting state owns only the outer connection and retained Observable descriptions. Joining owns one connection occurrence per collected description, including repeated descriptions. Cancellation during collection starts no inner work. Cancellation during joining releases the live inner connections and emits no terminal notification.

The operators add no clock, scheduler, sharing or replay. Explicit input order resolves equal timestamps. Canonical bounds limit modeled histories and do not create native queue-overflow behavior. Native-only projector, overload and synchronous-setup cases stay separate from the canonical tuple profiles.

## Type and publication contracts

The **47 negative compiler assertions** are separate from runtime test counts: [zip](../tests/types/session23-zip.ts), [zipAll](../tests/types/session23-zipAll.ts), and [zipWith](../tests/types/session23-zipWith.ts). The project compiler configuration and acceptance gates remain unchanged.

The [artifact navigation tests](../tests/session23-artifacts.test.mjs) check three public inspection indexes, exact membership of nine examples, all eleven steps, version-pinned source/spec links, direct model/native/differential links and nonempty local targets. The normal drift check owns byte-for-byte projection consistency and trace replay. A separate [catalogue test](../tests/session23-catalogue.test.mjs) compares inventory names with all 113 actual pinned native operator exports and checks index, rule and evidence coverage for every name. Nine examples × eight views plus three indexes give **75 new projections**.

Implementation source and upstream spec bodies are inspected independently of the local native suite. Universal infinite-run liveness, arbitrary reentrancy and throwing observers or producer teardown remain outside these reference models. Acceptance requires passing local checks, committed main verification, a separate read-only run, and recorded checkout/tree provenance.
