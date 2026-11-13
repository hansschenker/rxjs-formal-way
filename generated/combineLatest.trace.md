# combineLatest-1-observable-inputs: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | COMBINELATEST-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input#0); subscribe(input#1) | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":true}]} |
| 1 | 1 | COMBINELATEST-WAIT | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":true}]} |  | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":false,"live":true}]} |
| 2 | 2 | COMBINELATEST-EMIT | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":false,"live":true}]} | downstream.N([1,10]) | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":true,"live":true,"value":10}]} |
| 3 | 3 | COMBINELATEST-EMIT | {"type":"input.next","resource":{"id":"input","generation":0},"value":2} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":true,"live":true,"value":10}]} | downstream.N([2,10]) | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":2},{"ready":true,"live":true,"value":10}]} |
| 4 | 4 | COMBINELATEST-COMPLETE-WAIT | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":2},{"ready":true,"live":true,"value":10}]} | unsubscribe(input#0) | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":10}]} |
| 5 | 5 | COMBINELATEST-EMIT | {"type":"input.next","resource":{"id":"input","generation":1},"value":11} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":10}]} | downstream.N([2,11]) | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":11}]} |
| 6 | 6 | COMBINELATEST-COMPLETE-LAST | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":11}]} | downstream.C(); unsubscribe(input#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"type":"input.next","resource":{"id":"input","generation":0},"value":2} | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"type":"input.next","resource":{"id":"input","generation":1},"value":11} | {"type":"input.complete","resource":{"id":"input","generation":1}} |
| Control / state | {"phase":"Active","current":0,"slots":[{"ready":false,"live":true},{"ready":false,"live":true}]} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":false,"live":true}]} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":1},{"ready":true,"live":true,"value":10}]} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":true,"value":2},{"ready":true,"live":true,"value":10}]} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":10}]} | {"phase":"Active","current":0,"slots":[{"ready":true,"live":false,"value":2},{"ready":true,"live":true,"value":11}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N([1,10]) | downstream.N([2,10]) | none | downstream.N([2,11]) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
