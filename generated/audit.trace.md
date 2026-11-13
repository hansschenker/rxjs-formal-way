# audit-Observable-duration: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | AUDIT-INIT | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Idle","now":0,"nextId":0} |
| 1 | 1 | AUDIT-START | {"type":"source.next","now":1,"value":"a"} | {"phase":"Idle","now":0,"nextId":0} | invoke(duration-selector#0, value="a", index=0) | {"phase":"Calling","now":1,"nextId":1,"value":"a","callback":{"id":"duration-selector","generation":0}} |
| 2 | 1 | AUDIT-CALL-RETURN | {"type":"callback.return","now":1,"resource":{"id":"duration-selector","generation":0}} | {"phase":"Calling","now":1,"nextId":1,"value":"a","callback":{"id":"duration-selector","generation":0}} | subscribe(duration#0) | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"duration","generation":0},"scheduledFor":1} |
| 3 | 2 | AUDIT-REPLACE | {"type":"source.next","now":2,"value":"b"} | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"duration","generation":0},"scheduledFor":1} |  | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"duration","generation":0},"scheduledFor":1} |
| 4 | 3 | AUDIT-DURATION-NEXT | {"type":"duration.next","now":3,"resource":{"id":"duration","generation":0}} | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"duration","generation":0},"scheduledFor":1} | unsubscribe(duration#0); downstream.N("b") | {"phase":"Idle","now":3,"nextId":1} |
| 5 | 4 | AUDIT-START | {"type":"source.next","now":4,"value":"c"} | {"phase":"Idle","now":3,"nextId":1} | invoke(duration-selector#1, value="c", index=1) | {"phase":"Calling","now":4,"nextId":2,"value":"c","callback":{"id":"duration-selector","generation":1}} |
| 6 | 4 | AUDIT-CALL-RETURN | {"type":"callback.return","now":4,"resource":{"id":"duration-selector","generation":1}} | {"phase":"Calling","now":4,"nextId":2,"value":"c","callback":{"id":"duration-selector","generation":1}} | subscribe(duration#1) | {"phase":"Pending","now":4,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} |
| 7 | 5 | AUDIT-COMPLETE-PENDING | {"type":"source.complete","now":5} | {"phase":"Pending","now":4,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} | unsubscribe(source#0) | {"phase":"Waiting","now":5,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} |
| 8 | 7 | AUDIT-WAITING-DURATION-NEXT | {"type":"duration.next","now":7,"resource":{"id":"duration","generation":1}} | {"phase":"Waiting","now":5,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} | unsubscribe(duration#1); downstream.N("c"); downstream.C() | {"phase":"Closed","now":7,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 4 | 4 | 5 | 7 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":"a"} | {"type":"callback.return","now":1,"resource":{"id":"duration-selector","generation":0}} | {"type":"source.next","now":2,"value":"b"} | {"type":"duration.next","now":3,"resource":{"id":"duration","generation":0}} | {"type":"source.next","now":4,"value":"c"} | {"type":"callback.return","now":4,"resource":{"id":"duration-selector","generation":1}} | {"type":"source.complete","now":5} | {"type":"duration.next","now":7,"resource":{"id":"duration","generation":1}} |
| Control / state | {"phase":"Idle","now":0,"nextId":0} | {"phase":"Calling","now":1,"nextId":1,"value":"a","callback":{"id":"duration-selector","generation":0}} | {"phase":"Pending","now":1,"nextId":1,"value":"a","duration":{"id":"duration","generation":0},"scheduledFor":1} | {"phase":"Pending","now":2,"nextId":1,"value":"b","duration":{"id":"duration","generation":0},"scheduledFor":1} | {"phase":"Idle","now":3,"nextId":1} | {"phase":"Calling","now":4,"nextId":2,"value":"c","callback":{"id":"duration-selector","generation":1}} | {"phase":"Pending","now":4,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} | {"phase":"Waiting","now":5,"nextId":2,"value":"c","duration":{"id":"duration","generation":1},"scheduledFor":4} | {"phase":"Closed","now":7,"reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("b") | none | none | none | downstream.N("c"); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
