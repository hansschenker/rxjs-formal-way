# timeout-first-relative-6-each-3-factory: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMEOUT-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(timeoutTimer#0, delay=6) | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":6}} |
| 1 | 1 | S21-TIMEOUT-NEXT-CANCEL-TIMER | {"type":"source.next","now":1,"value":"A"} | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":6}} | cancel-timer(timeoutTimer#0); downstream.N("A"); schedule(timeoutTimer#1, delay=3) | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":4}} |
| 2 | 4 | S21-TIMEOUT-EXPIRE | {"type":"timer.fire","now":4,"resource":{"id":"timeoutTimer","generation":1}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":4}} | unsubscribe(source#0); cancel-timer(timeoutTimer#1); invoke(timeoutFactory#0, value={"meta":null,"seen":1,"lastValue":null}, index=0) | {"phase":"Choosing","clock":4,"seen":1} |
| 3 | 4 | S21-TIMEOUT-FACTORY-RETURN | {"type":"callback.return","now":4,"resource":{"id":"timeoutFactory","generation":0},"token":"fallback"} | {"phase":"Choosing","clock":4,"seen":1} | subscribe(fallback#0) | {"phase":"Fallback","clock":4,"token":"fallback"} |
| 4 | 5 | S21-TIMEOUT-FALLBACK-NEXT | {"type":"fallback.next","now":5,"resource":{"id":"fallback","generation":0},"value":"R"} | {"phase":"Fallback","clock":4,"token":"fallback"} | downstream.N("R") | {"phase":"Fallback","clock":5,"token":"fallback"} |
| 5 | 7 | S21-TIMEOUT-FALLBACK-COMPLETE | {"type":"fallback.complete","now":7,"resource":{"id":"fallback","generation":0}} | {"phase":"Fallback","clock":5,"token":"fallback"} | downstream.C(); unsubscribe(fallback#0) | {"phase":"Closed","clock":7,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 4 | 4 | 5 | 7 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"A"} | {"type":"timer.fire","now":4,"resource":{"id":"timeoutTimer","generation":1}} | {"type":"callback.return","now":4,"resource":{"id":"timeoutFactory","generation":0},"token":"fallback"} | {"type":"fallback.next","now":5,"resource":{"id":"fallback","generation":0},"value":"R"} | {"type":"fallback.complete","now":7,"resource":{"id":"fallback","generation":0}} |
| Control / state | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":6}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":4}} | {"phase":"Choosing","clock":4,"seen":1} | {"phase":"Fallback","clock":4,"token":"fallback"} | {"phase":"Fallback","clock":5,"token":"fallback"} | {"phase":"Closed","clock":7,"reason":"complete"} |
| Output notifications | none | downstream.N("A") | none | none | downstream.N("R") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
