# materialize-notifications: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S14-MATERIALIZE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active"} |
| 1 | 1 | S14-MATERIALIZE-NEXT | {"type":"source.next","value":"alpha"} | {"phase":"Active"} | downstream.N({"kind":"N","value":"alpha","hasValue":true}) | {"phase":"Active"} |
| 2 | 3 | S14-MATERIALIZE-NEXT | {"type":"source.next","value":"beta"} | {"phase":"Active"} | downstream.N({"kind":"N","value":"beta","hasValue":true}) | {"phase":"Active"} |
| 3 | 4 | S14-MATERIALIZE-END | {"type":"source.complete"} | {"phase":"Active"} | downstream.N({"kind":"C","hasValue":false}); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"alpha"} | {"type":"source.next","value":"beta"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N({"kind":"N","value":"alpha","hasValue":true}) | downstream.N({"kind":"N","value":"beta","hasValue":true}) | downstream.N({"kind":"C","hasValue":false}); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
