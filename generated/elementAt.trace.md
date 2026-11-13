# elementAt-2-default: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | ELEMENTAT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0} |
| 1 | 1 | ELEMENTAT-SKIP | {"type":"source.next","value":"a"} | {"phase":"Active","index":0} |  | {"phase":"Active","index":1} |
| 2 | 2 | ELEMENTAT-SKIP | {"type":"source.next","value":"b"} | {"phase":"Active","index":1} |  | {"phase":"Active","index":2} |
| 3 | 3 | ELEMENTAT-HIT | {"type":"source.next","value":"c"} | {"phase":"Active","index":2} | downstream.N("c"); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"source.next","value":"c"} |
| Control / state | {"phase":"Active","index":0} | {"phase":"Active","index":1} | {"phase":"Active","index":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N("c"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
