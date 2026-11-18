# throttle-00: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-THROTTLE-START | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} |
| 1 | 1 | S20-THROTTLE-OPEN-NEXT | {"type":"source.next","value":"A","now":1} | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | invoke(durationSelector#0, value="A", index=0) | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Selecting","generation":0,"argument":"A"} |
| 2 | 1 | S20-THROTTLE-SELECTOR-RETURN | {"type":"callback.return","resource":{"id":"durationSelector","generation":0},"token":"duration-A","now":1} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Selecting","generation":0,"argument":"A"} | subscribe(duration#0) | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} |
| 3 | 2 | S20-THROTTLE-REMEMBER | {"type":"source.next","value":"B","now":2} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} |  | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} |
| 4 | 3 | S20-THROTTLE-COMPLETE-NOW | {"type":"source.complete","now":3} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} | downstream.C(); unsubscribe(source#0); unsubscribe(duration#0) | {"phase":"Closed","clock":3,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","value":"A","now":1} | {"type":"callback.return","resource":{"id":"durationSelector","generation":0},"token":"duration-A","now":1} | {"type":"source.next","value":"B","now":2} | {"type":"source.complete","now":3} |
| Control / state | {"phase":"Open","clock":0,"nextGeneration":0,"hasValue":false,"value":null} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Selecting","generation":0,"argument":"A"} | {"clock":1,"nextGeneration":1,"hasValue":true,"value":"A","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} | {"clock":2,"nextGeneration":1,"hasValue":true,"value":"B","phase":"Throttled","generation":0,"due":null,"token":"duration-A"} | {"phase":"Closed","clock":3,"reason":"complete"} |
| Output notifications | none | none | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
