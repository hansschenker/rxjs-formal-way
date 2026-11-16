# single-indexed-predicate: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S19-SINGLE-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","seen":false,"hasValue":false,"index":0} |
| 1 | 1 | S19-SINGLE-PREDICATE | {"type":"source.next","value":3} | {"phase":"Active","seen":false,"hasValue":false,"index":0} | invoke(predicate#0, value=3, index=0) | {"phase":"Calling","seen":true,"hasValue":false,"index":0,"candidate":3} |
| 2 | 1 | S19-SINGLE-REJECT | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"phase":"Calling","seen":true,"hasValue":false,"index":0,"candidate":3} |  | {"phase":"Active","seen":true,"hasValue":false,"index":1} |
| 3 | 2 | S19-SINGLE-PREDICATE | {"type":"source.next","value":4} | {"phase":"Active","seen":true,"hasValue":false,"index":1} | invoke(predicate#1, value=4, index=1) | {"phase":"Calling","seen":true,"hasValue":false,"index":1,"candidate":4} |
| 4 | 2 | S19-SINGLE-FIRST-MATCH | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"phase":"Calling","seen":true,"hasValue":false,"index":1,"candidate":4} |  | {"phase":"Active","seen":true,"hasValue":true,"value":4,"index":2} |
| 5 | 3 | S19-SINGLE-FOUND | {"type":"source.complete"} | {"phase":"Active","seen":true,"hasValue":true,"value":4,"index":2} | downstream.N(4); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":false} | {"type":"source.next","value":4} | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":true} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","seen":false,"hasValue":false,"index":0} | {"phase":"Calling","seen":true,"hasValue":false,"index":0,"candidate":3} | {"phase":"Active","seen":true,"hasValue":false,"index":1} | {"phase":"Calling","seen":true,"hasValue":false,"index":1,"candidate":4} | {"phase":"Active","seen":true,"hasValue":true,"value":4,"index":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N(4); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
