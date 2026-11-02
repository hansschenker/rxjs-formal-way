# skipUntil-Observable-notifier: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SKIPUNTIL-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the notifier, before the source | starting with a closed source gate | S5-SKIPUNTIL-SETUP |
| SKIPUNTIL-SOURCE-CONNECT | Starting | setup.ready | notifier setup returned without terminating downstream | subscribe to the source | active with the existing gate and notifier-liveness state | S5-SKIPUNTIL-SETUP |
| SKIPUNTIL-SETUP-NOTIFIER-NEXT | Starting | notifier.next | matching live notifier subscription | release notifier without emitting any value | gate permanently open with notifier disconnected | S5-SKIPUNTIL-SETUP |
| SKIPUNTIL-SETUP-NOTIFIER-COMPLETE | Starting | notifier.complete | matching live notifier subscription | release notifier without completing downstream or changing the gate | same gate with notifier disconnected | S5-SKIPUNTIL-SETUP |
| SKIPUNTIL-SETUP-NOTIFIER-ERROR | Starting | notifier.error | matching live notifier subscription | forward the notifier error unchanged; release notifier | downstream stopped but closed-subscriber source attempt still pending | S5-SKIPUNTIL-ERROR |
| SKIPUNTIL-LIVE-NOTIFIER-NEXT | Active | notifier.next | matching live notifier subscription | release notifier without emitting any value | gate permanently open with notifier disconnected | S5-SKIPUNTIL-SIGNAL |
| SKIPUNTIL-LIVE-NOTIFIER-COMPLETE | Active | notifier.complete | matching live notifier subscription | release notifier without completing downstream or changing the gate | same gate with notifier disconnected | S5-SKIPUNTIL-EMPTY |
| SKIPUNTIL-LIVE-NOTIFIER-ERROR | Active | notifier.error | matching live notifier subscription | forward the notifier error unchanged; release notifier; release source | closed because notifier errored | S5-SKIPUNTIL-ERROR |
| SKIPUNTIL-CLOSED-SOURCE-ATTEMPT | StoppedBeforeSource | setup.ready | notifier setup returned after synchronous error | attempt source subscription with an already-closed subscriber; dispose the returned source teardown immediately | fully closed with no live subscriptions | S5-SKIPUNTIL-ERROR |
| SKIPUNTIL-DROP | Active | source.next | gate is closed | no actions | same gate and notifier-liveness state | S5-SKIPUNTIL-VALUES |
| SKIPUNTIL-PASS | Active | source.next | gate is open | forward the source value unchanged | same gate and notifier-liveness state | S5-SKIPUNTIL-VALUES |
| SKIPUNTIL-SOURCE-COMPLETE | Active | source.complete | source connected, regardless of gate state | complete downstream; release notifier if still live, then release source | closed because of source.complete | S5-SKIPUNTIL-TERMINAL |
| SKIPUNTIL-SOURCE-ERROR | Active | source.error | source connected, regardless of gate state | forward the source error unchanged; release notifier if still live, then release source | closed because of source.error | S5-SKIPUNTIL-TERMINAL |
| SKIPUNTIL-CANCEL | Active | cancel | source connected, regardless of gate state | release notifier if still live, then release source | closed because of cancel | S5-SKIPUNTIL-TERMINAL |
