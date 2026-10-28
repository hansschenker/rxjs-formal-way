# filter-predicate: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | FILTER-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0} |
| 1 | 10 | FILTER-CALL | {"type":"source.next","value":3} | {"phase":"Active","index":0} | invoke(predicate#0, value=3, index=0) | {"phase":"Calling","index":1,"callId":0,"input":3} |
| 2 | 10 | FILTER-DROP | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"phase":"Calling","index":1,"callId":0,"input":3} |  | {"phase":"Active","index":1} |
| 3 | 20 | FILTER-CALL | {"type":"source.next","value":4} | {"phase":"Active","index":1} | invoke(predicate#1, value=4, index=1) | {"phase":"Calling","index":2,"callId":1,"input":4} |
| 4 | 20 | FILTER-PASS | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"phase":"Calling","index":2,"callId":1,"input":4} | downstream.N(4) | {"phase":"Active","index":2} |
| 5 | 30 | FILTER-COMPLETE | {"type":"source.complete"} | {"phase":"Active","index":2} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 10 | 10 | 20 | 20 | 30 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"type":"source.next","value":4} | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0} | {"phase":"Calling","index":1,"callId":0,"input":3} | {"phase":"Active","index":1} | {"phase":"Calling","index":2,"callId":1,"input":4} | {"phase":"Active","index":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N(4) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
