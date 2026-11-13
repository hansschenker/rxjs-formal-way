# skip-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | SKIP-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0} |
| 1 | 1 | SKIP-DROP | {"type":"source.next","value":"a"} | {"phase":"Active","index":0} |  | {"phase":"Active","index":1} |
| 2 | 2 | SKIP-DROP | {"type":"source.next","value":"b"} | {"phase":"Active","index":1} |  | {"phase":"Active","index":2} |
| 3 | 3 | SKIP-PASS | {"type":"source.next","value":"c"} | {"phase":"Active","index":2} | downstream.N("c") | {"phase":"Active","index":3} |
| 4 | 4 | SKIP-COMPLETE | {"type":"source.complete"} | {"phase":"Active","index":3} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"source.next","value":"c"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0} | {"phase":"Active","index":1} | {"phase":"Active","index":2} | {"phase":"Active","index":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N("c") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
