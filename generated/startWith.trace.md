# startWith-unscheduled-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | STARTWITH-INIT-PREFIX | {"type":"subscribe"} | {"phase":"Unsubscribed"} |  | {"phase":"Prefix","index":0} |
| 1 | 0 | STARTWITH-EMIT | {"type":"prefix.next"} | {"phase":"Prefix","index":0} | downstream.N("before-a") | {"phase":"Prefix","index":1} |
| 2 | 0 | STARTWITH-EMIT | {"type":"prefix.next"} | {"phase":"Prefix","index":1} | downstream.N("before-b") | {"phase":"Prefix","index":2} |
| 3 | 0 | STARTWITH-CONNECT | {"type":"prefix.complete"} | {"phase":"Prefix","index":2} | subscribe(source#0) | {"phase":"Active"} |
| 4 | 1 | STARTWITH-NEXT | {"type":"source.next","value":5} | {"phase":"Active"} | downstream.N(5) | {"phase":"Active"} |
| 5 | 2 | STARTWITH-NEXT | {"type":"source.next","value":6} | {"phase":"Active"} | downstream.N(6) | {"phase":"Active"} |
| 6 | 3 | STARTWITH-COMPLETE | {"type":"source.complete"} | {"phase":"Active"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 0 | 0 | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"prefix.next"} | {"type":"prefix.next"} | {"type":"prefix.complete"} | {"type":"source.next","value":5} | {"type":"source.next","value":6} | {"type":"source.complete"} |
| Control / state | {"phase":"Prefix","index":0} | {"phase":"Prefix","index":1} | {"phase":"Prefix","index":2} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Active"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("before-a") | downstream.N("before-b") | none | downstream.N(5) | downstream.N(6) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
