# throttleTime-11-4: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-THROTTLETIME-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} |
| 1 | 1 | S20-THROTTLETIME-OPEN-NEXT | {"type":"source.next","value":"A","now":1} | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | downstream.N("A"); schedule(throttleTimer#0, delay=4) | {"clock":1,"nextGeneration":1,"hasValue":false,"value":null,"phase":"Throttled","generation":0,"due":5,"token":null} |
| 2 | 2 | S20-THROTTLETIME-REMEMBER | {"type":"source.next","value":"B","now":2} | {"clock":1,"nextGeneration":1,"hasValue":false,"value":null,"phase":"Throttled","generation":0,"due":5,"token":null} |  | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} |
| 3 | 3 | S20-THROTTLETIME-COMPLETE-WAIT | {"type":"source.complete","now":3} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} | unsubscribe(source#0) | {"clock":3,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Waiting","generation":0,"due":5,"token":null} |
| 4 | 5 | S20-THROTTLETIME-WAIT-END | {"type":"timer.fire","resource":{"id":"throttleTimer","generation":0},"now":5} | {"clock":3,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Waiting","generation":0,"due":5,"token":null} | cancel-timer(throttleTimer#0); downstream.N("B"); downstream.C() | {"phase":"Closed","clock":5,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 5 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","value":"A","now":1} | {"type":"source.next","value":"B","now":2} | {"type":"source.complete","now":3} | {"type":"timer.fire","resource":{"id":"throttleTimer","generation":0},"now":5} |
| Control / state | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | {"clock":1,"nextGeneration":1,"hasValue":false,"value":null,"phase":"Throttled","generation":0,"due":5,"token":null} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} | {"clock":3,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Waiting","generation":0,"due":5,"token":null} | {"phase":"Closed","clock":5,"reason":"complete"} |
| Output notifications | none | downstream.N("A") | none | none | downstream.N("B"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
