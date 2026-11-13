# count-predicate: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | AGG-COUNT-PREDICATE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Collecting","index":0,"memory":{"present":true,"value":0}} |
| 1 | 1 | AGG-COUNT-PREDICATE-CALL | {"type":"source.next","value":1} | {"phase":"Collecting","index":0,"memory":{"present":true,"value":0}} | invoke(aggregate-callback#0, value={"previous":0,"incoming":1}, index=0) | {"phase":"Calling","index":1,"callId":0,"memory":{"present":true,"value":0},"input":1} |
| 2 | 1 | AGG-COUNT-PREDICATE-RETURN | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":0},"value":true} | {"phase":"Calling","index":1,"callId":0,"memory":{"present":true,"value":0},"input":1} |  | {"phase":"Collecting","index":1,"memory":{"present":true,"value":1}} |
| 3 | 2 | AGG-COUNT-PREDICATE-CALL | {"type":"source.next","value":2} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":1}} | invoke(aggregate-callback#1, value={"previous":1,"incoming":2}, index=1) | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":1},"input":2} |
| 4 | 2 | AGG-COUNT-PREDICATE-RETURN | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":1},"value":false} | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":1},"input":2} |  | {"phase":"Collecting","index":2,"memory":{"present":true,"value":1}} |
| 5 | 3 | AGG-COUNT-PREDICATE-COMPLETE-SOME | {"type":"source.complete"} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":1}} | downstream.N(1); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":0},"value":true} | {"type":"source.next","value":2} | {"type":"callback.return","resource":{"id":"aggregate-callback","generation":1},"value":false} | {"type":"source.complete"} |
| Control / state | {"phase":"Collecting","index":0,"memory":{"present":true,"value":0}} | {"phase":"Calling","index":1,"callId":0,"memory":{"present":true,"value":0},"input":1} | {"phase":"Collecting","index":1,"memory":{"present":true,"value":1}} | {"phase":"Calling","index":2,"callId":1,"memory":{"present":true,"value":1},"input":2} | {"phase":"Collecting","index":2,"memory":{"present":true,"value":1}} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N(1); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
