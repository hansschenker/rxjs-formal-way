# throwIfEmpty-default: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-THROWIFEMPTY-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Listening","hasValue":false} |
| 1 | 2 | S20-THROWIFEMPTY-NEXT | {"type":"source.next","value":"A"} | {"phase":"Listening","hasValue":false} | downstream.N("A") | {"phase":"Listening","hasValue":true} |
| 2 | 4 | S20-THROWIFEMPTY-COMPLETE-NONEMPTY | {"type":"source.complete"} | {"phase":"Listening","hasValue":true} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 |
|---|---|---|---|
| Time | 0 | 2 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"A"} | {"type":"source.complete"} |
| Control / state | {"phase":"Listening","hasValue":false} | {"phase":"Listening","hasValue":true} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("A") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
