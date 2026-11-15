# refCount-publish-Subject-legacy: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S18-REFCOUNT-CONNECT | {"type":"subscriber.subscribe","subscriber":"A"} | {"phase":"Disconnected","nextConnection":0,"used":[]} | subscribe(source#0) | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A"],"used":["A"],"nextConnection":1} |
| 1 | 1 | S18-REFCOUNT-JOIN | {"type":"subscriber.subscribe","subscriber":"B"} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A"],"used":["A"],"nextConnection":1} |  | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} |
| 2 | 2 | S18-REFCOUNT-NEXT | {"type":"source.next","resource":{"id":"source","generation":0},"value":"shared"} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} | A.N("shared"); B.N("shared") | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} |
| 3 | 3 | S18-REFCOUNT-LEAVE | {"type":"subscriber.unsubscribe","subscriber":"A"} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} |  | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} |
| 4 | 4 | S18-REFCOUNT-NEXT | {"type":"source.next","resource":{"id":"source","generation":0},"value":"B-only"} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} | B.N("B-only") | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} |
| 5 | 5 | S18-REFCOUNT-LAST-RESET | {"type":"subscriber.unsubscribe","subscriber":"B"} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} | unsubscribe(source#0) | {"phase":"Disconnected","nextConnection":1,"used":["A","B"]} |
| 6 | 6 | S18-REFCOUNT-CONNECT | {"type":"subscriber.subscribe","subscriber":"C"} | {"phase":"Disconnected","nextConnection":1,"used":["A","B"]} | subscribe(source#1) | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} |
| 7 | 7 | S18-REFCOUNT-NEXT | {"type":"source.next","resource":{"id":"source","generation":1},"value":"new connection"} | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} | C.N("new connection") | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} |
| 8 | 8 | S18-REFCOUNT-COMPLETE-RETAIN | {"type":"source.complete","resource":{"id":"source","generation":1}} | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} | C.C(); unsubscribe(source#1) | {"phase":"Completed","nextConnection":2,"used":["A","B","C"]} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscriber.subscribe","subscriber":"A"} | {"type":"subscriber.subscribe","subscriber":"B"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":"shared"} | {"type":"subscriber.unsubscribe","subscriber":"A"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":"B-only"} | {"type":"subscriber.unsubscribe","subscriber":"B"} | {"type":"subscriber.subscribe","subscriber":"C"} | {"type":"source.next","resource":{"id":"source","generation":1},"value":"new connection"} | {"type":"source.complete","resource":{"id":"source","generation":1}} |
| Control / state | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A"],"used":["A"],"nextConnection":1} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["A","B"],"used":["A","B"],"nextConnection":1} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} | {"phase":"Connected","connection":{"id":"source","generation":0},"subscribers":["B"],"used":["A","B"],"nextConnection":1} | {"phase":"Disconnected","nextConnection":1,"used":["A","B"]} | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} | {"phase":"Connected","connection":{"id":"source","generation":1},"subscribers":["C"],"used":["A","B","C"],"nextConnection":2} | {"phase":"Completed","nextConnection":2,"used":["A","B","C"]} |
| Output notifications | none | none | A.N("shared"); B.N("shared") | none | B.N("B-only") | none | none | C.N("new connection") | C.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
