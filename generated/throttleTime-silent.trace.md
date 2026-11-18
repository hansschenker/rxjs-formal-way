# throttleTime-00-4: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-THROTTLETIME-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} |
| 1 | 1 | S20-THROTTLETIME-OPEN-NEXT | {"type":"source.next","value":"A","now":1} | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | schedule(throttleTimer#0, delay=4) | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":5,"token":null} |
| 2 | 2 | S20-THROTTLETIME-REMEMBER | {"type":"source.next","value":"B","now":2} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":5,"token":null} |  | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} |
| 3 | 3 | S20-THROTTLETIME-COMPLETE-NOW | {"type":"source.complete","now":3} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} | downstream.C(); unsubscribe(source#0); cancel-timer(throttleTimer#0) | {"phase":"Closed","clock":3,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","value":"A","now":1} | {"type":"source.next","value":"B","now":2} | {"type":"source.complete","now":3} |
| Control / state | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":5,"token":null} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":5,"token":null} | {"phase":"Closed","clock":3,"reason":"complete"} |
| Output notifications | none | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
