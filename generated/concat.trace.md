# concat-2-observable-inputs: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | CONCAT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input#0) | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} |
| 1 | 1 | CONCAT-NEXT | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} | downstream.N(1) | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} |
| 2 | 2 | CONCAT-COMPLETE-ADVANCE | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} | unsubscribe(input#0); subscribe(input#1) | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} |
| 3 | 3 | CONCAT-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":2} | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} | downstream.N(2) | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} |
| 4 | 4 | CONCAT-COMPLETE-ADVANCE | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} | unsubscribe(input#1); subscribe(input#2) | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} |
| 5 | 5 | CONCAT-NEXT | {"type":"input.next","resource":{"id":"input","generation":2},"value":3} | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} | downstream.N(3) | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} |
| 6 | 6 | CONCAT-COMPLETE-LAST | {"type":"input.complete","resource":{"id":"input","generation":2}} | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} | downstream.C(); unsubscribe(input#2) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"type":"input.next","resource":{"id":"input","generation":1},"value":2} | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"type":"input.next","resource":{"id":"input","generation":2},"value":3} | {"type":"input.complete","resource":{"id":"input","generation":2}} |
| Control / state | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":false},{"ready":false,"live":false}]} | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} | {"phase":"Active","current":1,"slots":[{"ready":false,"live":false},{"ready":false,"live":true},{"ready":false,"live":false}]} | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} | {"phase":"Active","current":2,"slots":[{"ready":false,"live":false},{"ready":false,"live":false},{"ready":false,"live":true}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | none | downstream.N(2) | none | downstream.N(3) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
