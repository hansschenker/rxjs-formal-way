# timeout-first-none-each-4-default: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMEOUT-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(timeoutTimer#0, delay=4) | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} |
| 1 | 1 | S21-TIMEOUT-NEXT-CANCEL-TIMER | {"type":"source.next","now":1,"value":"A"} | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | cancel-timer(timeoutTimer#0); downstream.N("A"); schedule(timeoutTimer#1, delay=4) | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} |
| 2 | 3 | S21-TIMEOUT-NEXT-CANCEL-TIMER | {"type":"source.next","now":3,"value":"B"} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} | cancel-timer(timeoutTimer#1); downstream.N("B"); schedule(timeoutTimer#2, delay=4) | {"phase":"Source","clock":3,"seen":2,"lastValue":"B","nextGeneration":3,"timer":{"generation":2,"due":7}} |
| 3 | 4 | S21-TIMEOUT-SOURCE-COMPLETE | {"type":"source.complete","now":4} | {"phase":"Source","clock":3,"seen":2,"lastValue":"B","nextGeneration":3,"timer":{"generation":2,"due":7}} | downstream.C(); unsubscribe(source#0); cancel-timer(timeoutTimer#2) | {"phase":"Closed","clock":4,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 3 | 4 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"A"} | {"type":"source.next","now":3,"value":"B"} | {"type":"source.complete","now":4} |
| Control / state | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":2,"timer":{"generation":1,"due":5}} | {"phase":"Source","clock":3,"seen":2,"lastValue":"B","nextGeneration":3,"timer":{"generation":2,"due":7}} | {"phase":"Closed","clock":4,"reason":"complete"} |
| Output notifications | none | downstream.N("A") | downstream.N("B") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
