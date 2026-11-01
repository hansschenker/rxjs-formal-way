# startWith-unscheduled-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| STARTWITH-INIT-EMPTY | Unsubscribed | subscribe | zero supplied values | subscribe source immediately | active with source subscription | S4-STARTWITH-EMPTY |
| STARTWITH-INIT-PREFIX | Unsubscribed | subscribe | one or more prefix values | begin synchronous prefix delivery without subscribing to source | prefix phase with index zero | S4-STARTWITH-PREFIX |
| STARTWITH-EMIT | Prefix | prefix.next | prefix index < configured length | emit the current prefix payload synchronously | prefix phase with advanced index | S4-STARTWITH-PREFIX |
| STARTWITH-CONNECT | Prefix | prefix.complete | every prefix value emitted | subscribe source after the last prefix notification returns | active; source now subscribed | S4-STARTWITH-ORDER |
| STARTWITH-CANCEL-PREFIX | Prefix | cancel | cancel before source acquisition | stop prefix delivery; no source subscription to release | closed before subscribing to source | S4-STARTWITH-CANCEL |
| STARTWITH-NEXT | Active | source.next | source connected | forward source value unchanged | active | S4-STARTWITH-ORDER |
| STARTWITH-COMPLETE | Active | source.complete | source completed after prefix | complete downstream; release source | closed after completion | S4-STARTWITH-LIFECYCLE |
| STARTWITH-ERROR | Active | source.error | source errored after prefix | forward exact error; release source | closed after error | S4-STARTWITH-LIFECYCLE |
| STARTWITH-CANCEL-ACTIVE | Active | cancel | source already subscribed | release source without completion | closed by cancellation | S4-STARTWITH-CANCEL |
