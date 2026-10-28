# take-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | TAKE-INIT-POSITIVE | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","seen":0} |
| 1 | 10 | TAKE-NEXT-PASS | {"type":"source.next","value":"a"} | {"phase":"Active","seen":0} | downstream.N("a") | {"phase":"Active","seen":1} |
| 2 | 20 | TAKE-NEXT-LAST | {"type":"source.next","value":"b"} | {"phase":"Active","seen":1} | downstream.N("b"); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"quota"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 |
|---|---|---|---|
| Time | 0 | 10 | 20 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} |
| Control / state | {"phase":"Active","seen":0} | {"phase":"Active","seen":1} | {"phase":"Closed","reason":"quota"} |
| Output notifications | none | downstream.N("a") | downstream.N("b"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
