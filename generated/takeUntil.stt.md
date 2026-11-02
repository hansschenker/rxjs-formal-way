# takeUntil-Observable-notifier: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| TAKEUNTIL-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the notifier, before the source | starting with an open source gate | S5-TAKEUNTIL-SETUP |
| TAKEUNTIL-SOURCE-CONNECT | Starting | setup.ready | notifier setup returned without terminating downstream | subscribe to the source | active with the existing gate and notifier-liveness state | S5-TAKEUNTIL-SETUP |
| TAKEUNTIL-SETUP-NOTIFIER-NEXT | Starting | notifier.next | matching live notifier subscription | complete downstream; release notifier | closed because notifier emitted | S5-TAKEUNTIL-SETUP |
| TAKEUNTIL-SETUP-NOTIFIER-COMPLETE | Starting | notifier.complete | matching live notifier subscription | release notifier without completing downstream or changing the gate | same gate with notifier disconnected | S5-TAKEUNTIL-SETUP |
| TAKEUNTIL-SETUP-NOTIFIER-ERROR | Starting | notifier.error | matching live notifier subscription | forward the notifier error unchanged; release notifier | closed because notifier errored | S5-TAKEUNTIL-ERROR |
| TAKEUNTIL-LIVE-NOTIFIER-NEXT | Active | notifier.next | matching live notifier subscription | complete downstream; release notifier; release source | closed because notifier emitted | S5-TAKEUNTIL-SIGNAL |
| TAKEUNTIL-LIVE-NOTIFIER-COMPLETE | Active | notifier.complete | matching live notifier subscription | release notifier without completing downstream or changing the gate | same gate with notifier disconnected | S5-TAKEUNTIL-EMPTY |
| TAKEUNTIL-LIVE-NOTIFIER-ERROR | Active | notifier.error | matching live notifier subscription | forward the notifier error unchanged; release notifier; release source | closed because notifier errored | S5-TAKEUNTIL-ERROR |
| TAKEUNTIL-PASS | Active | source.next | gate is open | forward the source value unchanged | same gate and notifier-liveness state | S5-TAKEUNTIL-VALUES |
| TAKEUNTIL-SOURCE-COMPLETE | Active | source.complete | source connected, regardless of gate state | complete downstream; release notifier if still live, then release source | closed because of source.complete | S5-TAKEUNTIL-TERMINAL |
| TAKEUNTIL-SOURCE-ERROR | Active | source.error | source connected, regardless of gate state | forward the source error unchanged; release notifier if still live, then release source | closed because of source.error | S5-TAKEUNTIL-TERMINAL |
| TAKEUNTIL-CANCEL | Active | cancel | source connected, regardless of gate state | release notifier if still live, then release source | closed because of cancel | S5-TAKEUNTIL-TERMINAL |
