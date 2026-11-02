# skipWhile-predicate: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | SKIPWHILE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Testing","index":0} |
| 1 | 1 | SKIPWHILE-CALL | {"type":"source.next","value":1} | {"phase":"Testing","index":0} | invoke(predicate#0, value=1, index=0) | {"phase":"Calling","index":1,"callId":0,"input":1} |
| 2 | 1 | SKIPWHILE-TRUE | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":true} | {"phase":"Calling","index":1,"callId":0,"input":1} |  | {"phase":"Testing","index":1} |
| 3 | 2 | SKIPWHILE-CALL | {"type":"source.next","value":3} | {"phase":"Testing","index":1} | invoke(predicate#1, value=3, index=1) | {"phase":"Calling","index":2,"callId":1,"input":3} |
| 4 | 2 | SKIPWHILE-FALSE | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":false} | {"phase":"Calling","index":2,"callId":1,"input":3} | downstream.N(3) | {"phase":"Open"} |
| 5 | 3 | SKIPWHILE-OPEN-PASS | {"type":"source.next","value":1} | {"phase":"Open"} | downstream.N(1) | {"phase":"Open"} |
| 6 | 4 | SKIPWHILE-OPEN-COMPLETE | {"type":"source.complete"} | {"phase":"Open"} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"predicate","generation":0},"value":true} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"predicate","generation":1},"value":false} | {"type":"source.next","value":1} | {"type":"source.complete"} |
| Control / state | {"phase":"Testing","index":0} | {"phase":"Calling","index":1,"callId":0,"input":1} | {"phase":"Testing","index":1} | {"phase":"Calling","index":2,"callId":1,"input":3} | {"phase":"Open"} | {"phase":"Open"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N(3) | downstream.N(1) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
