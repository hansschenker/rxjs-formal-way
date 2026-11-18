# timeoutWith-first-none-each-4-constant: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMEOUTWITH-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(timeoutTimer#0, delay=4) | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} |
| 1 | 1 | S21-TIMEOUTWITH-NEXT-CANCEL-TIMER | {"type":"source.next","now":1,"value":"A"} | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | cancel-timer(timeoutTimer#0); downstream.N("A"); schedule(timeoutTimer#1, delay=4) | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} |
| 2 | 5 | S21-TIMEOUTWITH-EXPIRE | {"type":"timer.fire","now":5,"resource":{"id":"timeoutTimer","generation":1}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} | unsubscribe(source#0); cancel-timer(timeoutTimer#1); subscribe(fallback#0) | {"phase":"Fallback","clock":5,"token":"fallback"} |
| 3 | 6 | S21-TIMEOUTWITH-FALLBACK-NEXT | {"type":"fallback.next","now":6,"resource":{"id":"fallback","generation":0},"value":"R"} | {"phase":"Fallback","clock":5,"token":"fallback"} | downstream.N("R") | {"phase":"Fallback","clock":6,"token":"fallback"} |
| 4 | 8 | S21-TIMEOUTWITH-FALLBACK-COMPLETE | {"type":"fallback.complete","now":8,"resource":{"id":"fallback","generation":0}} | {"phase":"Fallback","clock":6,"token":"fallback"} | downstream.C(); unsubscribe(fallback#0) | {"phase":"Closed","clock":8,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 5 | 6 | 8 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"A"} | {"type":"timer.fire","now":5,"resource":{"id":"timeoutTimer","generation":1}} | {"type":"fallback.next","now":6,"resource":{"id":"fallback","generation":0},"value":"R"} | {"type":"fallback.complete","now":8,"resource":{"id":"fallback","generation":0}} |
| Control / state | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} | {"phase":"Fallback","clock":5,"token":"fallback"} | {"phase":"Fallback","clock":6,"token":"fallback"} | {"phase":"Closed","clock":8,"reason":"complete"} |
| Output notifications | none | downstream.N("A") | none | downstream.N("R") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
