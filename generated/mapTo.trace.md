# mapTo-constant: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S13-MAPTO-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active"} |
| 1 | 2 | S13-MAPTO-REPLACE | {"type":"source.next","value":8} | {"phase":"Active"} | downstream.N("constant") | {"phase":"Active"} |
| 2 | 3 | S13-MAPTO-REPLACE | {"type":"source.next","value":9} | {"phase":"Active"} | downstream.N("constant") | {"phase":"Active"} |
| 3 | 4 | S13-MAPTO-COMPLETE | {"type":"source.complete"} | {"phase":"Active"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":8} | {"type":"source.next","value":9} | {"type":"source.complete"} |
| Control / state | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("constant") | downstream.N("constant") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
