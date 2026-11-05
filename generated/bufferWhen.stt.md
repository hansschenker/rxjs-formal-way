# bufferWhen-Observable-selector: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| BUFFERWHEN-INIT | Unsubscribed | subscribe | fresh subscription | open empty buffer; invoke initial closing selector | await selector | S8-BUFFERWHEN-INIT |
| BUFFERWHEN-CALLBACK-RETURN | Calling | callback.return | matching selector generation | connect selected closing Observable; connect source if first buffer | retain exact buffer and resource bindings | S8-BUFFERWHEN-CALLBACK-RETURN |
| BUFFERWHEN-CALLBACK-THROW | Calling | callback.throw | matching selector generation | forward exact thrown error; release all owned subscriptions without flush | terminal | S8-BUFFERWHEN-CALLBACK-THROW |
| BUFFERWHEN-SOURCE-NEXT | Active | source.next | source connected | append source value to every open buffer | retain exact buffer and resource bindings | S8-BUFFERWHEN-SOURCE-NEXT |
| BUFFERWHEN-SOURCE-COMPLETE | Active | source.complete | source connected | flush all open buffers in opening order; complete; release resources | terminal | S8-BUFFERWHEN-SOURCE-COMPLETE |
| BUFFERWHEN-SOURCE-ERROR | Active | source.error | source connected | forward error; dispose without flush | terminal | S8-BUFFERWHEN-SOURCE-ERROR |
| BUFFERWHEN-CANCEL-ACTIVE | Active | cancel | active execution | release resources; do not notify downstream | terminal | S8-BUFFERWHEN-CANCEL-ACTIVE |
| BUFFERWHEN-CANCEL-CALLING | Calling | cancel | pending selector call, between microsteps | release owned subscriptions; do not notify | terminal | S8-BUFFERWHEN-CANCEL-CALLING |
| BUFFERWHEN-CLOSING-NEXT | Active | closing.next | matching live closing generation | close previous selector subscription; replace with empty buffer; emit old array; invoke next selector | await selector | S8-BUFFERWHEN-CLOSING-NEXT |
| BUFFERWHEN-CLOSING-COMPLETE | Active | closing.complete | matching live closing generation | release completed closing subscription; do not flush | retain exact buffer and resource bindings | S8-BUFFERWHEN-CLOSING-COMPLETE |
| BUFFERWHEN-CLOSING-ERROR | Active | closing.error | matching live closing generation | forward closing error; release all resources | terminal | S8-BUFFERWHEN-CLOSING-ERROR |
