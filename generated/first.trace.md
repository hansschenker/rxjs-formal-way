# first-predicate-required: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | FIRST-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0} |
| 1 | 1 | FIRST-CALL | {"type":"source.next","value":1} | {"phase":"Active","index":0} | invoke(predicate#0, value=1, index=0) | {"phase":"Calling","index":0,"value":1} |
| 2 | 1 | FIRST-MISS | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"phase":"Calling","index":0,"value":1} |  | {"phase":"Active","index":1} |
| 3 | 2 | FIRST-CALL | {"type":"source.next","value":3} | {"phase":"Active","index":1} | invoke(predicate#1, value=3, index=1) | {"phase":"Calling","index":1,"value":3} |
| 4 | 2 | FIRST-MATCH | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"phase":"Calling","index":1,"value":3} | downstream.N(3); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} |
| Control / state | {"phase":"Active","index":0} | {"phase":"Calling","index":0,"value":1} | {"phase":"Active","index":1} | {"phase":"Calling","index":1,"value":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N(3); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
