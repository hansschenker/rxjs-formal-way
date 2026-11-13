# last-predicate-required: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S13-LAST-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0,"hasMatch":false} |
| 1 | 1 | S13-LAST-CHECK | {"type":"source.next","value":1} | {"phase":"Active","index":0,"hasMatch":false} | invoke(predicate#0, value=1, index=0) | {"phase":"Calling","index":1,"hasMatch":false,"pending":1} |
| 2 | 2 | S13-LAST-REJECT | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"phase":"Calling","index":1,"hasMatch":false,"pending":1} |  | {"phase":"Active","index":1,"hasMatch":false} |
| 3 | 3 | S13-LAST-CHECK | {"type":"source.next","value":2} | {"phase":"Active","index":1,"hasMatch":false} | invoke(predicate#1, value=2, index=1) | {"phase":"Calling","index":2,"hasMatch":false,"pending":2} |
| 4 | 4 | S13-LAST-MATCH | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"phase":"Calling","index":2,"hasMatch":false,"pending":2} |  | {"phase":"Active","index":2,"hasMatch":true,"value":2} |
| 5 | 5 | S13-LAST-CHECK | {"type":"source.next","value":3} | {"phase":"Active","index":2,"hasMatch":true,"value":2} | invoke(predicate#2, value=3, index=2) | {"phase":"Calling","index":3,"hasMatch":true,"value":2,"pending":3} |
| 6 | 6 | S13-LAST-REJECT | {"type":"callback.return","resource":{"id":"predicate","generation":2},"value":false} | {"phase":"Calling","index":3,"hasMatch":true,"value":2,"pending":3} |  | {"phase":"Active","index":3,"hasMatch":true,"value":2} |
| 7 | 7 | S13-LAST-EMIT-LAST | {"type":"source.complete"} | {"phase":"Active","index":3,"hasMatch":true,"value":2} | downstream.N(2); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 |
|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"type":"source.next","value":2} | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"predicate","generation":2},"value":false} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0,"hasMatch":false} | {"phase":"Calling","index":1,"hasMatch":false,"pending":1} | {"phase":"Active","index":1,"hasMatch":false} | {"phase":"Calling","index":2,"hasMatch":false,"pending":2} | {"phase":"Active","index":2,"hasMatch":true,"value":2} | {"phase":"Calling","index":3,"hasMatch":true,"value":2,"pending":3} | {"phase":"Active","index":3,"hasMatch":true,"value":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | none | none | downstream.N(2); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
