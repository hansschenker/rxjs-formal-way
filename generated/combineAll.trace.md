# combineAll-deferred-latest-array: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | COMBINEALL-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Collecting","sources":[]} |
| 1 | 1 | COMBINEALL-OUTER-NEXT | {"type":"outer.next","value":"left"} | {"phase":"Collecting","sources":[]} |  | {"phase":"Collecting","sources":["left"]} |
| 2 | 2 | COMBINEALL-OUTER-NEXT | {"type":"outer.next","value":"right"} | {"phase":"Collecting","sources":["left"]} |  | {"phase":"Collecting","sources":["left","right"]} |
| 3 | 3 | COMBINEALL-OUTER-JOIN | {"type":"outer.complete"} | {"phase":"Collecting","sources":["left","right"]} | unsubscribe(outer#0); subscribe(inner#0); subscribe(inner#1) | {"phase":"Joining","slots":[{"source":"left","ready":false,"live":true},{"source":"right","ready":false,"live":true}]} |
| 4 | 4 | COMBINEALL-INNER-WAIT | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":1} | {"phase":"Joining","slots":[{"source":"left","ready":false,"live":true},{"source":"right","ready":false,"live":true}]} |  | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":false,"live":true}]} |
| 5 | 5 | COMBINEALL-INNER-EMIT | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":10} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":false,"live":true}]} | downstream.N([1,10]) | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":true,"live":true,"value":10}]} |
| 6 | 6 | COMBINEALL-INNER-EMIT | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":2} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":true,"live":true,"value":10}]} | downstream.N([2,10]) | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} |
| 7 | 7 | COMBINEALL-INNER-COMPLETE-WAIT | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} | unsubscribe(inner#0) | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":false,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} |
| 8 | 8 | COMBINEALL-INNER-COMPLETE-LAST | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":false,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} | downstream.C(); unsubscribe(inner#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"left"} | {"type":"outer.next","value":"right"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":1} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":10} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":2} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Collecting","sources":[]} | {"phase":"Collecting","sources":["left"]} | {"phase":"Collecting","sources":["left","right"]} | {"phase":"Joining","slots":[{"source":"left","ready":false,"live":true},{"source":"right","ready":false,"live":true}]} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":false,"live":true}]} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":1},{"source":"right","ready":true,"live":true,"value":10}]} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":true,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} | {"phase":"Joining","slots":[{"source":"left","ready":true,"live":false,"value":2},{"source":"right","ready":true,"live":true,"value":10}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N([1,10]) | downstream.N([2,10]) | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
