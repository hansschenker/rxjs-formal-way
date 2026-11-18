# timeout-first-relative-4-each-none-default: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S21-TIMEOUT-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(timeoutTimer#0, delay=4) | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} |
| 1 | 1 | S21-TIMEOUT-NEXT-CANCEL-TIMER | {"type":"source.next","now":1,"value":"A"} | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | cancel-timer(timeoutTimer#0); downstream.N("A") | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":1,"timer":null} |
| 2 | 9 | S21-TIMEOUT-NEXT-UNARMED | {"type":"source.next","now":9,"value":"B"} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":1,"timer":null} | downstream.N("B") | {"phase":"Source","clock":9,"seen":2,"lastValue":"B","nextGeneration":1,"timer":null} |
| 3 | 10 | S21-TIMEOUT-SOURCE-COMPLETE | {"type":"source.complete","now":10} | {"phase":"Source","clock":9,"seen":2,"lastValue":"B","nextGeneration":1,"timer":null} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","clock":10,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 9 | 10 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"A"} | {"type":"source.next","now":9,"value":"B"} | {"type":"source.complete","now":10} |
| Control / state | {"phase":"Source","clock":0,"seen":0,"lastValue":null,"nextGeneration":1,"timer":{"generation":0,"due":4}} | {"phase":"Source","clock":1,"seen":1,"lastValue":"A","nextGeneration":1,"timer":null} | {"phase":"Source","clock":9,"seen":2,"lastValue":"B","nextGeneration":1,"timer":null} | {"phase":"Closed","clock":10,"reason":"complete"} |
| Output notifications | none | downstream.N("A") | downstream.N("B") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
