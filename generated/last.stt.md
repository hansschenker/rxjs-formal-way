# last-predicate-required: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S13-LAST-INIT | Unsubscribed | subscribe | fresh subscription | subscribe source | updated control and subscription-local memory | S13-LAST-INIT |
| S13-LAST-TAKE | Active | source.next | no predicate configured | store last value; no output | updated control and subscription-local memory | S13-LAST-TAKE |
| S13-LAST-CHECK | Active | source.next | predicate configured and source value arrives | invoke indexed predicate | updated control and subscription-local memory | S13-LAST-CHECK |
| S13-LAST-MATCH | Calling | callback.return | correlated callback returned truthy | remember pending value | updated control and subscription-local memory | S13-LAST-MATCH |
| S13-LAST-REJECT | Calling | callback.return | correlated callback returned falsy | keep previous candidate | updated control and subscription-local memory | S13-LAST-REJECT |
| S13-LAST-PREDICATE-ERROR | Calling | callback.throw | correlated callback throws | forward same error; release source | terminal with no owned work | S13-LAST-PREDICATE-ERROR |
| S13-LAST-EMIT-LAST | Active | source.complete | candidate exists | emit last candidate; complete; release source | terminal with no owned work | S13-LAST-EMIT-LAST |
| S13-LAST-EMIT-DEFAULT | Active | source.complete | no candidate and default was explicitly supplied | emit fallback; complete; release source | terminal with no owned work | S13-LAST-EMIT-DEFAULT |
| S13-LAST-EMPTY-ERROR | Active | source.complete | no candidate and default absent | emit EmptyError; release source | terminal with no owned work | S13-LAST-EMPTY-ERROR |
| S13-LAST-SOURCE-ERROR | Active | source.error | source errors | forward exact error; release source | terminal with no owned work | S13-LAST-SOURCE-ERROR |
| S13-LAST-CANCEL | Active | cancel | consumer closes | release source silently | terminal with no owned work | S13-LAST-CANCEL |
