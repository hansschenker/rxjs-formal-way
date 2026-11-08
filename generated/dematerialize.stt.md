# dematerialize-notification-values: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DEMATERIALIZE-INIT | Unsubscribed | subscribe | fresh subscription | acquire source | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-INIT |
| DEMATERIALIZE-NEXT | Active | source.next | notification.kind=N | forward embedded payload | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-NEXT |
| DEMATERIALIZE-EMBEDDED-COMPLETE | Active | source.next | notification.kind=C | complete downstream; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-EMBEDDED-COMPLETE |
| DEMATERIALIZE-EMBEDDED-ERROR | Active | source.next | notification.kind=E | error with embedded identity; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-EMBEDDED-ERROR |
| DEMATERIALIZE-SOURCE-COMPLETE | Active | source.complete | source completes without embedded terminal | complete; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-SOURCE-COMPLETE |
| DEMATERIALIZE-SOURCE-ERROR | Active | source.error | outer errors | forward source error; release source | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-SOURCE-ERROR |
| DEMATERIALIZE-CANCEL | Active | cancel | downstream closes | release source silently | control and memory updated atomically; resource lifetime follows ordered actions | S11-DEMATERIALIZE-CANCEL |
