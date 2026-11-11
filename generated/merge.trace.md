# merge-static-2-concurrency-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | S14-MERGE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input#0); subscribe(input#1) | {"phase":"Active","live":[0,1],"pending":[2],"total":3} |
| 1 | 1 | S14-MERGE-NEXT | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | downstream.N(1) | {"phase":"Active","live":[0,1],"pending":[2],"total":3} |
| 2 | 2 | S14-MERGE-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | downstream.N(10) | {"phase":"Active","live":[0,1],"pending":[2],"total":3} |
| 3 | 3 | S14-MERGE-REFILL | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | unsubscribe(input#0); subscribe(input#2) | {"phase":"Active","live":[1,2],"pending":[],"total":3} |
| 4 | 4 | S14-MERGE-NEXT | {"type":"input.next","resource":{"id":"input","generation":2},"value":20} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | downstream.N(20) | {"phase":"Active","live":[1,2],"pending":[],"total":3} |
| 5 | 5 | S14-MERGE-COMPLETE-WAIT | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | unsubscribe(input#1) | {"phase":"Active","live":[2],"pending":[],"total":3} |
| 6 | 6 | S14-MERGE-COMPLETE-LAST | {"type":"input.complete","resource":{"id":"input","generation":2}} | {"phase":"Active","live":[2],"pending":[],"total":3} | downstream.C(); unsubscribe(input#2) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":0},"value":1} | {"type":"input.next","resource":{"id":"input","generation":1},"value":10} | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"type":"input.next","resource":{"id":"input","generation":2},"value":20} | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"type":"input.complete","resource":{"id":"input","generation":2}} |
| Control / state | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | {"phase":"Active","live":[0,1],"pending":[2],"total":3} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | {"phase":"Active","live":[2],"pending":[],"total":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | downstream.N(10) | none | downstream.N(20) | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
