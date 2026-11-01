# distinct-direct-flush: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DISTINCT-INIT | Unsubscribed | subscribe | fresh result subscription | subscribe source; subscribe flush notifier if configured; source first | active with empty Set and optional flush subscription | S4-DISTINCT-INIT |
| DISTINCT-SELECT | Active | source.next | selector configured and index is valid | request a correlated key selection with the original value | selecting a key with existing Set retained | S4-DISTINCT-SELECT |
| DISTINCT-DIRECT-PASS | Active | source.next | no key selector and Set does not contain incoming value under SameValueZero | add original value to Set before forwarding it | active with enlarged Set | S4-DISTINCT-DIRECT |
| DISTINCT-DIRECT-DROP | Active | source.next | no key selector and Set already contains incoming value under SameValueZero | no actions | active with unchanged Set and increased index | S4-DISTINCT-DIRECT |
| DISTINCT-KEY-PASS | Selecting | key.return | matching selection and previously unseen key under SameValueZero | add selected key then forward original source value | active with enlarged keyed Set | S4-DISTINCT-KEY |
| DISTINCT-KEY-DROP | Selecting | key.return | matching selection and previously seen key under SameValueZero | no actions | active with unchanged Set | S4-DISTINCT-KEY |
| DISTINCT-KEY-ERROR | Selecting | key.throw | matching selector invocation | forward exact selector error; release source and active notifier | closed by selector error | S4-DISTINCT-THROW |
| DISTINCT-FLUSH | Active | flush.next | notifier still active | clear the Set without forwarding the flush value | active with empty Set | S4-DISTINCT-FLUSH |
| DISTINCT-FLUSH-COMPLETE | Active | flush.complete | notifier still active | release notifier subscription without completing downstream or clearing the Set | active, with the existing Set but no future flush events | S4-DISTINCT-FLUSH |
| DISTINCT-FLUSH-ERROR | Active | flush.error | notifier still active | forward exact notifier error; release both subscriptions | closed after notifier error | S4-DISTINCT-FLUSH |
| DISTINCT-COMPLETE | Active | source.complete | no pending selector | complete result; release source and active notifier | closed after source completion | S4-DISTINCT-LIFECYCLE |
| DISTINCT-ERROR | Active | source.error | no pending selector | forward exact source error; release source and active notifier | closed after source error | S4-DISTINCT-LIFECYCLE |
| DISTINCT-CANCEL | Active | cancel | between completed source reactions | release source and active notifier without downstream completion | closed by cancellation | S4-DISTINCT-LIFECYCLE |
