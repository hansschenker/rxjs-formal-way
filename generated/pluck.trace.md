# pluck-plain-data-path: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S16-PLUCK-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed","count":0,"reason":"none"} | subscribe(source#0) | {"phase":"Active","count":0,"reason":"none"} |
| 1 | 1 | S16-PLUCK-NEXT | {"type":"source.next","value":{"person":{"name":"Ada"}}} | {"phase":"Active","count":0,"reason":"none"} | downstream.N("Ada") | {"phase":"Active","count":1,"reason":"none"} |
| 2 | 2 | S16-PLUCK-NEXT | {"type":"source.next","value":{"person":{}}} | {"phase":"Active","count":1,"reason":"none"} | downstream.N(undefined) | {"phase":"Active","count":2,"reason":"none"} |
| 3 | 3 | S16-PLUCK-COMPLETE | {"type":"source.complete"} | {"phase":"Active","count":2,"reason":"none"} | unsubscribe(source#0); downstream.C() | {"phase":"Closed","count":2,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":{"person":{"name":"Ada"}}} | {"type":"source.next","value":{"person":{}}} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","count":0,"reason":"none"} | {"phase":"Active","count":1,"reason":"none"} | {"phase":"Active","count":2,"reason":"none"} | {"phase":"Closed","count":2,"reason":"complete"} |
| Output notifications | none | downstream.N("Ada") | downstream.N(undefined) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
