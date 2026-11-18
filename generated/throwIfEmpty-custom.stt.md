# throwIfEmpty-custom: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-THROWIFEMPTY-START | Unsubscribed | subscribe | first consumer connection | subscribe source | Listening with hasValue=false. | S20-THROWIFEMPTY-START |
| S20-THROWIFEMPTY-NEXT | Listening | source.next | source subscription is live | forward exact source value | Listening with hasValue=true, including when the value is undefined. | S20-THROWIFEMPTY-NEXT |
| S20-THROWIFEMPTY-COMPLETE-NONEMPTY | Listening | source.complete | at least one value has arrived | complete result; release source | Closed complete; never invoke the factory. | S20-THROWIFEMPTY-COMPLETE-NONEMPTY |
| S20-THROWIFEMPTY-COMPLETE-EMPTY | Listening | source.complete | no value has arrived | invoke the selected error factory once | CreatingError; waiting only for its correlated synchronous outcome. | S20-THROWIFEMPTY-COMPLETE-EMPTY |
| S20-THROWIFEMPTY-FACTORY-RETURN | CreatingError | callback.return | outcome belongs to errorFactory invocation zero | error with the exact returned value; release source | Closed error; no completion notification. | S20-THROWIFEMPTY-FACTORY-RETURN |
| S20-THROWIFEMPTY-FACTORY-THROW | CreatingError | callback.throw | outcome belongs to errorFactory invocation zero | forward the exact thrown value as error; release source | Closed error; no completion notification. | S20-THROWIFEMPTY-FACTORY-THROW |
| S20-THROWIFEMPTY-SOURCE-ERROR | Listening | source.error | source fails, regardless of value presence | forward exact source error; release source | Closed error; factory never invoked. | S20-THROWIFEMPTY-SOURCE-ERROR |
| S20-THROWIFEMPTY-CANCEL | Listening | cancel | consumer cancels before source termination | release source silently | Closed cancel; factory never invoked. | S20-THROWIFEMPTY-CANCEL |
