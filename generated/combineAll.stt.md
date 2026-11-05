# combineAll-deferred-latest-array: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| COMBINEALL-INIT | Unsubscribed | subscribe | fresh subscription | connect outer | preserve ordered source and latest bindings | S8-COMBINEALL-INIT |
| COMBINEALL-OUTER-NEXT | Collecting | outer.next | outer still open; bounded count | retain source identity in arrival order | preserve ordered source and latest bindings | S8-COMBINEALL-OUTER-NEXT |
| COMBINEALL-OUTER-EMPTY | Collecting | outer.complete | no collected inner sources | complete without value; release outer | terminal | S8-COMBINEALL-OUTER-EMPTY |
| COMBINEALL-OUTER-JOIN | Collecting | outer.complete | at least one collected inner source | release outer; subscribe all collected inner sources in arrival order | preserve ordered source and latest bindings | S8-COMBINEALL-OUTER-JOIN |
| COMBINEALL-OUTER-ERROR | Collecting | outer.error | outer still active | error without joining any inners; release outer | terminal | S8-COMBINEALL-OUTER-ERROR |
| COMBINEALL-INNER-WAIT | Joining | inner.next | live inner and at least one slot remains unready | record latest and first-value status; no output | preserve ordered source and latest bindings | S8-COMBINEALL-INNER-WAIT |
| COMBINEALL-INNER-EMIT | Joining | inner.next | live inner and every other slot ready | update one latest value; emit fresh ordered tuple | preserve ordered source and latest bindings | S8-COMBINEALL-INNER-EMIT |
| COMBINEALL-INNER-COMPLETE-WAIT | Joining | inner.complete | live inner and another still live | release completed inner, retain its last value | preserve ordered source and latest bindings | S8-COMBINEALL-INNER-COMPLETE-WAIT |
| COMBINEALL-INNER-COMPLETE-LAST | Joining | inner.complete | final live inner | complete; release final inner | terminal | S8-COMBINEALL-INNER-COMPLETE-LAST |
| COMBINEALL-INNER-ERROR | Joining | inner.error | matching live inner | error immediately; release all live inner subscriptions | terminal | S8-COMBINEALL-INNER-ERROR |
| COMBINEALL-CANCEL-COLLECT | Collecting | cancel | outer live | release outer silently | terminal | S8-COMBINEALL-CANCEL-COLLECT |
| COMBINEALL-CANCEL-JOIN | Joining | cancel | join live | release live inners silently | terminal | S8-COMBINEALL-CANCEL-JOIN |
