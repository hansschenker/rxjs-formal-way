# groupBy-default-subject-key-leases: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S13-GROUPBY-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","index":0,"nextGroupId":0,"groups":[]} |
| 1 | 1 | S13-GROUPBY-SELECT-Active | {"type":"source.next","value":1} | {"phase":"Active","index":0,"nextGroupId":0,"groups":[]} | invoke(key#0, value=1, index=0) | {"phase":"Calling","resume":"Active","index":1,"nextGroupId":0,"groups":[],"pending":1} |
| 2 | 1 | S13-GROUPBY-KEY-NEW-Active | {"type":"callback.return","resource":{"id":"key","generation":0},"value":"odd"} | {"phase":"Calling","resume":"Active","index":1,"nextGroupId":0,"groups":[],"pending":1} | downstream.N({"key":"odd","groupId":0}); group:0.N(1) | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":0}]} |
| 3 | 2 | S13-GROUPBY-ATTACH-Active | {"type":"group.subscribe","groupId":0} | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":0}]} | subscribe(group:0#0) | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} |
| 4 | 3 | S13-GROUPBY-SELECT-Active | {"type":"source.next","value":3} | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} | invoke(key#1, value=3, index=1) | {"phase":"Calling","resume":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":3} |
| 5 | 3 | S13-GROUPBY-KEY-EXISTING-Active | {"type":"callback.return","resource":{"id":"key","generation":1},"value":"odd"} | {"phase":"Calling","resume":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":3} | group:0.N(3) | {"phase":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} |
| 6 | 4 | S13-GROUPBY-SELECT-Active | {"type":"source.next","value":2} | {"phase":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} | invoke(key#2, value=2, index=2) | {"phase":"Calling","resume":"Active","index":3,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":2} |
| 7 | 4 | S13-GROUPBY-KEY-NEW-Active | {"type":"callback.return","resource":{"id":"key","generation":2},"value":"even"} | {"phase":"Calling","resume":"Active","index":3,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":2} | downstream.N({"key":"even","groupId":1}); group:1.N(2) | {"phase":"Active","index":3,"nextGroupId":2,"groups":[{"groupId":0,"key":"odd","subscribers":1},{"groupId":1,"key":"even","subscribers":0}]} |
| 8 | 5 | S13-GROUPBY-DONE-Active | {"type":"source.complete"} | {"phase":"Active","index":3,"nextGroupId":2,"groups":[{"groupId":0,"key":"odd","subscribers":1},{"groupId":1,"key":"even","subscribers":0}]} | group:0.C(); group:1.C(); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 3 | 4 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"key","generation":0},"value":"odd"} | {"type":"group.subscribe","groupId":0} | {"type":"source.next","value":3} | {"type":"callback.return","resource":{"id":"key","generation":1},"value":"odd"} | {"type":"source.next","value":2} | {"type":"callback.return","resource":{"id":"key","generation":2},"value":"even"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","index":0,"nextGroupId":0,"groups":[]} | {"phase":"Calling","resume":"Active","index":1,"nextGroupId":0,"groups":[],"pending":1} | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":0}]} | {"phase":"Active","index":1,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} | {"phase":"Calling","resume":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":3} | {"phase":"Active","index":2,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}]} | {"phase":"Calling","resume":"Active","index":3,"nextGroupId":1,"groups":[{"groupId":0,"key":"odd","subscribers":1}],"pending":2} | {"phase":"Active","index":3,"nextGroupId":2,"groups":[{"groupId":0,"key":"odd","subscribers":1},{"groupId":1,"key":"even","subscribers":0}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N({"key":"odd","groupId":0}); group:0.N(1) | none | none | group:0.N(3) | none | downstream.N({"key":"even","groupId":1}); group:1.N(2) | group:0.C(); group:1.C(); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
