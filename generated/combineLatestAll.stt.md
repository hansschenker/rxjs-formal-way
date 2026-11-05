# combineLatestAll-deferred-latest-array: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| COMBINELATESTALL-INIT | Unsubscribed | subscribe | fresh subscription | connect outer | preserve ordered source and latest bindings | S8-COMBINELATESTALL-INIT |
| COMBINELATESTALL-OUTER-NEXT | Collecting | outer.next | outer still open; bounded count | retain source identity in arrival order | preserve ordered source and latest bindings | S8-COMBINELATESTALL-OUTER-NEXT |
| COMBINELATESTALL-OUTER-EMPTY | Collecting | outer.complete | no collected inner sources | complete without value; release outer | terminal | S8-COMBINELATESTALL-OUTER-EMPTY |
| COMBINELATESTALL-OUTER-JOIN | Collecting | outer.complete | at least one collected inner source | release outer; subscribe all collected inner sources in arrival order | preserve ordered source and latest bindings | S8-COMBINELATESTALL-OUTER-JOIN |
| COMBINELATESTALL-OUTER-ERROR | Collecting | outer.error | outer still active | error without joining any inners; release outer | terminal | S8-COMBINELATESTALL-OUTER-ERROR |
| COMBINELATESTALL-INNER-WAIT | Joining | inner.next | live inner and at least one slot remains unready | record latest and first-value status; no output | preserve ordered source and latest bindings | S8-COMBINELATESTALL-INNER-WAIT |
| COMBINELATESTALL-INNER-EMIT | Joining | inner.next | live inner and every other slot ready | update one latest value; emit fresh ordered tuple | preserve ordered source and latest bindings | S8-COMBINELATESTALL-INNER-EMIT |
| COMBINELATESTALL-INNER-COMPLETE-WAIT | Joining | inner.complete | live inner and another still live | release completed inner, retain its last value | preserve ordered source and latest bindings | S8-COMBINELATESTALL-INNER-COMPLETE-WAIT |
| COMBINELATESTALL-INNER-COMPLETE-LAST | Joining | inner.complete | final live inner | complete; release final inner | terminal | S8-COMBINELATESTALL-INNER-COMPLETE-LAST |
| COMBINELATESTALL-INNER-ERROR | Joining | inner.error | matching live inner | error immediately; release all live inner subscriptions | terminal | S8-COMBINELATESTALL-INNER-ERROR |
| COMBINELATESTALL-CANCEL-COLLECT | Collecting | cancel | outer live | release outer silently | terminal | S8-COMBINELATESTALL-CANCEL-COLLECT |
| COMBINELATESTALL-CANCEL-JOIN | Joining | cancel | join live | release live inners silently | terminal | S8-COMBINELATESTALL-CANCEL-JOIN |
