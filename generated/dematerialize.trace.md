# dematerialize-notification-values: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | DEMATERIALIZE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active"} |
| 1 | 1 | DEMATERIALIZE-NEXT | {"type":"source.next","notification":{"kind":"N","value":"a"}} | {"phase":"Active"} | downstream.N("a") | {"phase":"Active"} |
| 2 | 2 | DEMATERIALIZE-NEXT | {"type":"source.next","notification":{"kind":"N","value":"b"}} | {"phase":"Active"} | downstream.N("b") | {"phase":"Active"} |
| 3 | 3 | DEMATERIALIZE-EMBEDDED-COMPLETE | {"type":"source.next","notification":{"kind":"C"}} | {"phase":"Active"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","notification":{"kind":"N","value":"a"}} | {"type":"source.next","notification":{"kind":"N","value":"b"}} | {"type":"source.next","notification":{"kind":"C"}} |
| Control / state | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("a") | downstream.N("b") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
