# mergeWith-unbounded-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | S15-MERGEWITH-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(input#0); subscribe(input#1); subscribe(input#2) | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} |
| 1 | 1 | S15-MERGEWITH-NEXT | {"type":"input.next","resource":{"id":"input","generation":1},"value":"other"} | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | downstream.N("other") | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} |
| 2 | 2 | S15-MERGEWITH-NEXT | {"type":"input.next","resource":{"id":"input","generation":0},"value":"source"} | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | downstream.N("source") | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} |
| 3 | 3 | S15-MERGEWITH-COMPLETE-WAIT | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | unsubscribe(input#0) | {"phase":"Active","live":[1,2],"pending":[],"total":3} |
| 4 | 4 | S15-MERGEWITH-COMPLETE-WAIT | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | unsubscribe(input#1) | {"phase":"Active","live":[2],"pending":[],"total":3} |
| 5 | 5 | S15-MERGEWITH-COMPLETE-LAST | {"type":"input.complete","resource":{"id":"input","generation":2}} | {"phase":"Active","live":[2],"pending":[],"total":3} | downstream.C(); unsubscribe(input#2) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"input.next","resource":{"id":"input","generation":1},"value":"other"} | {"type":"input.next","resource":{"id":"input","generation":0},"value":"source"} | {"type":"input.complete","resource":{"id":"input","generation":0}} | {"type":"input.complete","resource":{"id":"input","generation":1}} | {"type":"input.complete","resource":{"id":"input","generation":2}} |
| Control / state | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | {"phase":"Active","live":[0,1,2],"pending":[],"total":3} | {"phase":"Active","live":[1,2],"pending":[],"total":3} | {"phase":"Active","live":[2],"pending":[],"total":3} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N("other") | downstream.N("source") | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
