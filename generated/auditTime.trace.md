# auditTime-3: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | AUDITTIME-INIT | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Idle","now":0,"nextId":0} |
| 1 | 1 | AUDITTIME-START | {"type":"source.next","now":1,"value":"a"} | {"phase":"Idle","now":0,"nextId":0} | schedule(audit-timer#0, delay=3) | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} |
| 2 | 2 | AUDITTIME-REPLACE | {"type":"source.next","now":2,"value":"b"} | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} |  | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} |
| 3 | 4 | AUDITTIME-DURATION-NEXT | {"type":"timer.fire","now":4,"resource":{"id":"audit-timer","generation":0}} | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} | cancel-timer(audit-timer#0); downstream.N("b") | {"phase":"Idle","now":4,"nextId":1} |
| 4 | 5 | AUDITTIME-START | {"type":"source.next","now":5,"value":"c"} | {"phase":"Idle","now":4,"nextId":1} | schedule(audit-timer#1, delay=3) | {"phase":"Pending","now":5,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} |
| 5 | 6 | AUDITTIME-COMPLETE-PENDING | {"type":"source.complete","now":6} | {"phase":"Pending","now":5,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} | unsubscribe(source#0) | {"phase":"Waiting","now":6,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} |
| 6 | 8 | AUDITTIME-WAITING-DURATION-NEXT | {"type":"timer.fire","now":8,"resource":{"id":"audit-timer","generation":1}} | {"phase":"Waiting","now":6,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} | cancel-timer(audit-timer#1); downstream.N("c"); downstream.C() | {"phase":"Closed","now":8,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 4 | 5 | 6 | 8 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"a"} | {"type":"source.next","now":2,"value":"b"} | {"type":"timer.fire","now":4,"resource":{"id":"audit-timer","generation":0}} | {"type":"source.next","now":5,"value":"c"} | {"type":"source.complete","now":6} | {"type":"timer.fire","now":8,"resource":{"id":"audit-timer","generation":1}} |
| Control / state | {"phase":"Idle","now":0,"nextId":0} | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"audit-timer","generation":0},"scheduledFor":4} | {"phase":"Idle","now":4,"nextId":1} | {"phase":"Pending","now":5,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} | {"phase":"Waiting","now":6,"nextId":2,"value":"c","duration":{"id":"audit-timer","generation":1},"scheduledFor":8} | {"phase":"Closed","now":8,"reason":"complete"} |
| Output notifications | none | none | none | downstream.N("b") | none | none | downstream.N("c"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
