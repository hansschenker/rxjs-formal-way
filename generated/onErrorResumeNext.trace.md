# onErrorResumeNext-pipeable-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S15-ONERRORRESUMENEXT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input#0) | {"phase":"Active","current":0,"total":3} |
| 1 | 1 | S15-ONERRORRESUMENEXT-NEXT | {"type":"input.next","resource":{"id":"input","generation":0},"value":"first"} | {"phase":"Active","current":0,"total":3} | downstream.N("first") | {"phase":"Active","current":0,"total":3} |
| 2 | 2 | S15-ONERRORRESUMENEXT-ERROR-ADVANCE | {"type":"input.error","resource":{"id":"input","generation":0},"error":"swallowed"} | {"phase":"Active","current":0,"total":3} | unsubscribe(input#0); subscribe(input#1) | {"phase":"Active","current":1,"total":3} |
| 3 | 3 | S15-ONERRORRESUMENEXT-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":"recovery"} | {"phase":"Active","current":1,"total":3} | downstream.N("recovery") | {"phase":"Active","current":1,"total":3} |
| 4 | 4 | S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Active","current":1,"total":3} | unsubscribe(input#1); subscribe(input#2) | {"phase":"Active","current":2,"total":3} |
| 5 | 5 | S15-ONERRORRESUMENEXT-ERROR-LAST | {"type":"input.error","resource":{"id":"input","generation":2},"error":"also swallowed"} | {"phase":"Active","current":2,"total":3} | unsubscribe(input#2); downstream.C() | {"phase":"Closed","reason":"exhausted"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":0},"value":"first"} | {"type":"input.error","resource":{"id":"input","generation":0},"error":"swallowed"} | {"type":"input.next","resource":{"id":"input","generation":1},"value":"recovery"} | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"type":"input.error","resource":{"id":"input","generation":2},"error":"also swallowed"} |
| Control / state | {"phase":"Active","current":0,"total":3} | {"phase":"Active","current":0,"total":3} | {"phase":"Active","current":1,"total":3} | {"phase":"Active","current":1,"total":3} | {"phase":"Active","current":2,"total":3} | {"phase":"Closed","reason":"exhausted"} |
| Output notifications | none | downstream.N("first") | none | downstream.N("recovery") | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
