# observeOn-virtual-fifo-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S15-OBSERVEON-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","sourceLive":true,"nextId":0,"lastSourceTime":0,"pending":[]} |
| 1 | 1 | S15-OBSERVEON-QUEUE-NEXT | {"type":"source.next","value":"a","now":1} | {"phase":"Active","sourceLive":true,"nextId":0,"lastSourceTime":0,"pending":[]} | schedule(scheduled#0, delay=2) | {"phase":"Active","sourceLive":true,"nextId":1,"lastSourceTime":1,"pending":[{"id":0,"due":3,"kind":"N","value":"a"}]} |
| 2 | 2 | S15-OBSERVEON-QUEUE-NEXT | {"type":"source.next","value":"b","now":2} | {"phase":"Active","sourceLive":true,"nextId":1,"lastSourceTime":1,"pending":[{"id":0,"due":3,"kind":"N","value":"a"}]} | schedule(scheduled#1, delay=2) | {"phase":"Active","sourceLive":true,"nextId":2,"lastSourceTime":2,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"}]} |
| 3 | 3 | S15-OBSERVEON-QUEUE-COMPLETE | {"type":"source.complete","now":3} | {"phase":"Active","sourceLive":true,"nextId":2,"lastSourceTime":2,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"}]} | schedule(scheduled#2, delay=2); unsubscribe(source#0) | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} |
| 4 | 3 | S15-OBSERVEON-FIRE-NEXT | {"type":"timer.fire","resource":{"id":"scheduled","generation":0},"now":3} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} | downstream.N("a"); cancel-timer(scheduled#0) | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} |
| 5 | 4 | S15-OBSERVEON-FIRE-NEXT | {"type":"timer.fire","resource":{"id":"scheduled","generation":1},"now":4} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} | downstream.N("b"); cancel-timer(scheduled#1) | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":2,"due":5,"kind":"C"}]} |
| 6 | 5 | S15-OBSERVEON-FIRE-COMPLETE | {"type":"timer.fire","resource":{"id":"scheduled","generation":2},"now":5} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":2,"due":5,"kind":"C"}]} | downstream.C(); cancel-timer(scheduled#2) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"a","now":1} | {"type":"source.next","value":"b","now":2} | {"type":"source.complete","now":3} | {"type":"timer.fire","resource":{"id":"scheduled","generation":0},"now":3} | {"type":"timer.fire","resource":{"id":"scheduled","generation":1},"now":4} | {"type":"timer.fire","resource":{"id":"scheduled","generation":2},"now":5} |
| Control / state | {"phase":"Active","sourceLive":true,"nextId":0,"lastSourceTime":0,"pending":[]} | {"phase":"Active","sourceLive":true,"nextId":1,"lastSourceTime":1,"pending":[{"id":0,"due":3,"kind":"N","value":"a"}]} | {"phase":"Active","sourceLive":true,"nextId":2,"lastSourceTime":2,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"}]} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":0,"due":3,"kind":"N","value":"a"},{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":1,"due":4,"kind":"N","value":"b"},{"id":2,"due":5,"kind":"C"}]} | {"phase":"Active","sourceLive":false,"nextId":3,"lastSourceTime":3,"pending":[{"id":2,"due":5,"kind":"C"}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("a") | downstream.N("b") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
