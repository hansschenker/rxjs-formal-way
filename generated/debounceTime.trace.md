# debounceTime-3: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DEBOUNCE-INIT | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Idle","now":0,"nextTimer":0} |
| 1 | 1 | DEBOUNCE-START | {"type":"source.next","now":1,"value":"a"} | {"phase":"Idle","now":0,"nextTimer":0} | schedule(debounce-timer#0, delay=3) | {"phase":"Pending","now":1,"nextTimer":1,"value":"a","lastTime":1,"deadline":4,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} |
| 2 | 3 | DEBOUNCE-REPLACE | {"type":"source.next","now":3,"value":"b"} | {"phase":"Pending","now":1,"nextTimer":1,"value":"a","lastTime":1,"deadline":4,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} |  | {"phase":"Pending","now":3,"nextTimer":1,"value":"b","lastTime":3,"deadline":6,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} |
| 3 | 4 | DEBOUNCE-REARM | {"type":"timer.fire","now":4,"resource":{"id":"debounce-timer","generation":0}} | {"phase":"Pending","now":3,"nextTimer":1,"value":"b","lastTime":3,"deadline":6,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} | schedule(debounce-timer#1, delay=2) | {"phase":"Pending","now":4,"nextTimer":2,"value":"b","lastTime":3,"deadline":6,"scheduledFor":6,"timer":{"id":"debounce-timer","generation":1}} |
| 4 | 6 | DEBOUNCE-EMIT | {"type":"timer.fire","now":6,"resource":{"id":"debounce-timer","generation":1}} | {"phase":"Pending","now":4,"nextTimer":2,"value":"b","lastTime":3,"deadline":6,"scheduledFor":6,"timer":{"id":"debounce-timer","generation":1}} | cancel-timer(debounce-timer#1); downstream.N("b") | {"phase":"Idle","now":6,"nextTimer":2} |
| 5 | 7 | DEBOUNCE-START | {"type":"source.next","now":7,"value":"c"} | {"phase":"Idle","now":6,"nextTimer":2} | schedule(debounce-timer#2, delay=3) | {"phase":"Pending","now":7,"nextTimer":3,"value":"c","lastTime":7,"deadline":10,"scheduledFor":10,"timer":{"id":"debounce-timer","generation":2}} |
| 6 | 8 | DEBOUNCE-COMPLETE-PENDING | {"type":"source.complete","now":8} | {"phase":"Pending","now":7,"nextTimer":3,"value":"c","lastTime":7,"deadline":10,"scheduledFor":10,"timer":{"id":"debounce-timer","generation":2}} | cancel-timer(debounce-timer#2); downstream.N("c"); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","now":8,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 3 | 4 | 6 | 7 | 8 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"a"} | {"type":"source.next","now":3,"value":"b"} | {"type":"timer.fire","now":4,"resource":{"id":"debounce-timer","generation":0}} | {"type":"timer.fire","now":6,"resource":{"id":"debounce-timer","generation":1}} | {"type":"source.next","now":7,"value":"c"} | {"type":"source.complete","now":8} |
| Control / state | {"phase":"Idle","now":0,"nextTimer":0} | {"phase":"Pending","now":1,"nextTimer":1,"value":"a","lastTime":1,"deadline":4,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} | {"phase":"Pending","now":3,"nextTimer":1,"value":"b","lastTime":3,"deadline":6,"scheduledFor":4,"timer":{"id":"debounce-timer","generation":0}} | {"phase":"Pending","now":4,"nextTimer":2,"value":"b","lastTime":3,"deadline":6,"scheduledFor":6,"timer":{"id":"debounce-timer","generation":1}} | {"phase":"Idle","now":6,"nextTimer":2} | {"phase":"Pending","now":7,"nextTimer":3,"value":"c","lastTime":7,"deadline":10,"scheduledFor":10,"timer":{"id":"debounce-timer","generation":2}} | {"phase":"Closed","now":8,"reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("b") | none | downstream.N("c"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
