# catchError-one-Observable-replacement: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| CATCHERROR-INIT | Unsubscribed | subscribe | fresh execution | subscribe original source | await or execute selected source | S8-CATCHERROR-INIT |
| CATCHERROR-SOURCE-NEXT | Source | source.next | original connected | forward exact value | await or execute selected source | S8-CATCHERROR-SOURCE-NEXT |
| CATCHERROR-SOURCE-ERROR | Source | source.error | source connected | request recovery selector with error and caught source | await or execute selected source | S8-CATCHERROR-SOURCE-ERROR |
| CATCHERROR-SELECTOR-RETURN | Calling | callback.return | matching callback resource | release original source; subscribe replacement Observable | await or execute selected source | S8-CATCHERROR-SELECTOR-RETURN |
| CATCHERROR-SELECTOR-THROW | Calling | callback.throw | matching selector (or synchronous throw without resource) | error with thrown value; release source | closed | S8-CATCHERROR-SELECTOR-THROW |
| CATCHERROR-SOURCE-COMPLETE | Source | source.complete | original connected | complete; release original source | closed | S8-CATCHERROR-SOURCE-COMPLETE |
| CATCHERROR-REPLACEMENT-NEXT | Replacement | replacement.next | replacement connected | forward replacement value | await or execute selected source | S8-CATCHERROR-REPLACEMENT-NEXT |
| CATCHERROR-REPLACEMENT-COMPLETE | Replacement | replacement.complete | replacement connected | complete; release replacement | closed | S8-CATCHERROR-REPLACEMENT-COMPLETE |
| CATCHERROR-REPLACEMENT-ERROR | Replacement | replacement.error | replacement connected | propagate replacement error; release replacement | closed | S8-CATCHERROR-REPLACEMENT-ERROR |
| CATCHERROR-CANCEL-SOURCE | Source | cancel | active subscription | unsubscribe current resource without output | closed | S8-CATCHERROR-CANCEL-SOURCE |
| CATCHERROR-CANCEL-CALLING | Calling | cancel | active subscription | unsubscribe current resource without output | closed | S8-CATCHERROR-CANCEL-CALLING |
| CATCHERROR-CANCEL-REPLACEMENT | Replacement | cancel | active subscription | unsubscribe current resource without output | closed | S8-CATCHERROR-CANCEL-REPLACEMENT |
