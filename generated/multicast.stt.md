# multicast-factory-selector-two-branches: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-MULTICAST-INIT | Unsubscribed | subscribe | fresh subscriber | create local Subject; request configured selector before source connection | state with documented resource ownership | S10-S15-MULTICAST-INIT |
| S15-MULTICAST-SELECTOR-READY | Preparing | selector.return | matching selected Observable | subscribe the selected output and its two shared branches; only then subscribe original source | state with documented resource ownership | S10-S15-MULTICAST-SELECTOR-READY |
| S15-MULTICAST-SELECTOR-THROW | Preparing | selector.throw | selector threw before source subscription | error without subscribing source | terminated; no late events legal | S10-S15-MULTICAST-SELECTOR-THROW |
| S15-MULTICAST-BROADCAST | Active | source.next | source subscribed through Subject | broadcast opaque value to branch 1; broadcast same value to branch 2 | state with documented resource ownership | S10-S15-MULTICAST-BROADCAST |
| S15-MULTICAST-COMPLETE | Active | source.complete | source completes | Subject completes selected branches; complete result; tear down selected then source | terminated; no late events legal | S10-S15-MULTICAST-COMPLETE |
| S15-MULTICAST-ERROR | Active | source.error | source errors | Subject errors selected branches; forward original error; release both subscriptions | terminated; no late events legal | S10-S15-MULTICAST-ERROR |
| S15-MULTICAST-CANCEL | Active | cancel | downstream cancels | tear down selected and source, no terminal notification | terminated; no late events legal | S10-S15-MULTICAST-CANCEL |
