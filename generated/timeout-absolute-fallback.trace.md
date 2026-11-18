# timeout-first-absolute-5-each-none-factory: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 2 | S21-TIMEOUT-START | {"type":"subscribe","now":2} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(timeoutTimer#0, delay=3) | {"phase":"Source","clock":2,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":5}} |
| 1 | 5 | S21-TIMEOUT-EXPIRE | {"type":"timer.fire","now":5,"resource":{"id":"timeoutTimer","generation":0}} | {"phase":"Source","clock":2,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":5}} | unsubscribe(source#0); cancel-timer(timeoutTimer#0); invoke(timeoutFactory#0, value={"meta":null,"seen":0,"lastValue":null}, index=0) | {"phase":"Choosing","clock":5,"seen":0} |
| 2 | 5 | S21-TIMEOUT-FACTORY-RETURN | {"type":"callback.return","now":5,"resource":{"id":"timeoutFactory","generation":0},"token":"fallback"} | {"phase":"Choosing","clock":5,"seen":0} | subscribe(fallback#0) | {"phase":"Fallback","clock":5,"token":"fallback"} |
| 3 | 6 | S21-TIMEOUT-FALLBACK-NEXT | {"type":"fallback.next","now":6,"resource":{"id":"fallback","generation":0},"value":"R"} | {"phase":"Fallback","clock":5,"token":"fallback"} | downstream.N("R") | {"phase":"Fallback","clock":6,"token":"fallback"} |
| 4 | 8 | S21-TIMEOUT-FALLBACK-COMPLETE | {"type":"fallback.complete","now":8,"resource":{"id":"fallback","generation":0}} | {"phase":"Fallback","clock":6,"token":"fallback"} | downstream.C(); unsubscribe(fallback#0) | {"phase":"Closed","clock":8,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 2 | 5 | 5 | 6 | 8 |
| Input | {"type":"subscribe","now":2} | {"type":"timer.fire","now":5,"resource":{"id":"timeoutTimer","generation":0}} | {"type":"callback.return","now":5,"resource":{"id":"timeoutFactory","generation":0},"token":"fallback"} | {"type":"fallback.next","now":6,"resource":{"id":"fallback","generation":0},"value":"R"} | {"type":"fallback.complete","now":8,"resource":{"id":"fallback","generation":0}} |
| Control / state | {"phase":"Source","clock":2,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":5}} | {"phase":"Choosing","clock":5,"seen":0} | {"phase":"Fallback","clock":5,"token":"fallback"} | {"phase":"Fallback","clock":6,"token":"fallback"} | {"phase":"Closed","clock":8,"reason":"complete"} |
| Output notifications | none | none | none | downstream.N("R") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
