# retry-bounded-restart-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S17-RETRY-START | {"type":"subscribe"} | {"phase":"Unsubscribed","generation":0,"attempts":0,"failures":0,"reason":"none"} | subscribe(source#0) | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} |
| 1 | 1 | S17-RETRY-NEXT | {"type":"source.next","resource":{"id":"source","generation":0},"value":"partial"} | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} | downstream.N("partial") | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} |
| 2 | 2 | S17-RETRY-RETRY | {"type":"source.error","resource":{"id":"source","generation":0},"error":"fail-one"} | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} | unsubscribe(source#0); subscribe(source#1) | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} |
| 3 | 3 | S17-RETRY-NEXT | {"type":"source.next","resource":{"id":"source","generation":1},"value":"success"} | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} | downstream.N("success") | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} |
| 4 | 4 | S17-RETRY-COMPLETE | {"type":"source.complete","resource":{"id":"source","generation":1}} | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} | downstream.C(); unsubscribe(source#1) | {"phase":"Closed","generation":1,"attempts":2,"failures":1,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":"partial"} | {"type":"source.error","resource":{"id":"source","generation":0},"error":"fail-one"} | {"type":"source.next","resource":{"id":"source","generation":1},"value":"success"} | {"type":"source.complete","resource":{"id":"source","generation":1}} |
| Control / state | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} | {"phase":"Active","generation":0,"attempts":1,"failures":0,"reason":"none"} | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} | {"phase":"Active","generation":1,"attempts":2,"failures":1,"reason":"none"} | {"phase":"Closed","generation":1,"attempts":2,"failures":1,"reason":"complete"} |
| Output notifications | none | downstream.N("partial") | none | downstream.N("success") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
