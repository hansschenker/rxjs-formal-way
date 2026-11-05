# bufferToggle-Observable-selector: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| BUFFERTOGGLE-INIT | Unsubscribed | subscribe | fresh subscription | connect openings; connect source | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-INIT |
| BUFFERTOGGLE-CALLBACK-RETURN | Calling | callback.return | matching selector generation | connect selected closing Observable; connect source if first buffer | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-CALLBACK-RETURN |
| BUFFERTOGGLE-CALLBACK-THROW | Calling | callback.throw | matching selector generation | forward exact thrown error; release all owned subscriptions without flush | terminal | S8-BUFFERTOGGLE-CALLBACK-THROW |
| BUFFERTOGGLE-SOURCE-NEXT | Active | source.next | source connected | append source value to every open buffer | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-SOURCE-NEXT |
| BUFFERTOGGLE-SOURCE-COMPLETE | Active | source.complete | source connected | flush all open buffers in opening order; complete; release resources | terminal | S8-BUFFERTOGGLE-SOURCE-COMPLETE |
| BUFFERTOGGLE-SOURCE-ERROR | Active | source.error | source connected | forward error; dispose without flush | terminal | S8-BUFFERTOGGLE-SOURCE-ERROR |
| BUFFERTOGGLE-CANCEL-ACTIVE | Active | cancel | active execution | release resources; do not notify downstream | terminal | S8-BUFFERTOGGLE-CANCEL-ACTIVE |
| BUFFERTOGGLE-CANCEL-CALLING | Calling | cancel | pending selector call, between microsteps | release owned subscriptions; do not notify | terminal | S8-BUFFERTOGGLE-CANCEL-CALLING |
| BUFFERTOGGLE-CLOSING-NEXT | Active | closing.next | matching live closing generation | remove selected buffer; emit array; unsubscribe selected closing | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-CLOSING-NEXT |
| BUFFERTOGGLE-CLOSING-COMPLETE | Active | closing.complete | matching live closing generation | release completed closing subscription; do not flush | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-CLOSING-COMPLETE |
| BUFFERTOGGLE-CLOSING-ERROR | Active | closing.error | matching live closing generation | forward closing error; release all resources | terminal | S8-BUFFERTOGGLE-CLOSING-ERROR |
| BUFFERTOGGLE-OPENINGS-NEXT | Active | openings.next | openings still subscribed, safe generation | add open buffer; invoke closing selector with opening value | await selector | S8-BUFFERTOGGLE-OPENINGS-NEXT |
| BUFFERTOGGLE-OPENINGS-COMPLETE | Active | openings.complete | openings still subscribed | release openings subscription; preserve buffers and source | retain exact buffer and resource bindings | S8-BUFFERTOGGLE-OPENINGS-COMPLETE |
| BUFFERTOGGLE-OPENINGS-ERROR | Active | openings.error | openings still subscribed | forward error; release all resources without flush | terminal | S8-BUFFERTOGGLE-OPENINGS-ERROR |
