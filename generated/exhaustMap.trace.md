# exhaustMap-1: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | EXHAUSTMAP-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | EXHAUSTMAP-ADMIT | {"type":"outer.next","value":"a"} | {"phase":"Active","index":0,"active":[],"queue":[]} | invoke(project#0, value="a", index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"a"} |
| 2 | 1 | EXHAUSTMAP-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"project","generation":0},"value":"A"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"a"} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 3 | 2 | EXHAUSTMAP-IGNORE | {"type":"outer.next","value":"ignored"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |  | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 4 | 3 | EXHAUSTMAP-NEXT-ACTIVE | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | downstream.N("a1") | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 5 | 4 | EXHAUSTMAP-INNER-END-ACTIVE | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | unsubscribe(inner#0) | {"phase":"Active","index":1,"active":[],"queue":[]} |
| 6 | 5 | EXHAUSTMAP-ADMIT | {"type":"outer.next","value":"b"} | {"phase":"Active","index":1,"active":[],"queue":[]} | invoke(project#1, value="b", index=1) | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"b"} |
| 7 | 5 | EXHAUSTMAP-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"project","generation":1},"value":"B"} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"b"} | subscribe(inner#1) | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 8 | 6 | EXHAUSTMAP-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | unsubscribe(outer#0) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 9 | 7 | EXHAUSTMAP-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | downstream.N("b1") | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 10 | 8 | EXHAUSTMAP-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | downstream.C(); unsubscribe(inner#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 | step 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 4 | 5 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"a"} | {"type":"callback.return","resource":{"id":"project","generation":0},"value":"A"} | {"type":"outer.next","value":"ignored"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"outer.next","value":"b"} | {"type":"callback.return","resource":{"id":"project","generation":1},"value":"B"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"a"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"b"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("a1") | none | none | none | none | downstream.N("b1") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
