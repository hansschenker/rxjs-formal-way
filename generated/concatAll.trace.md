# concatAll-1: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | CONCATALL-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | CONCATALL-ADMIT | {"type":"outer.next","value":"A"} | {"phase":"Active","index":0,"active":[],"queue":[]} | invoke(identity#0, value="A", index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} |
| 2 | 1 | CONCATALL-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"identity","generation":0},"value":"A"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 3 | 2 | CONCATALL-QUEUE | {"type":"outer.next","value":"B"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |  | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} |
| 4 | 3 | CONCATALL-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | unsubscribe(outer#0) | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} |
| 5 | 4 | CONCATALL-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | downstream.N("a1") | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} |
| 6 | 5 | CONCATALL-DRAIN-DRAINING | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | unsubscribe(inner#0); invoke(identity#1, value="B", index=1) | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":"B"} |
| 7 | 5 | CONCATALL-RETURN-DRAINING | {"type":"callback.return","resource":{"id":"identity","generation":1},"value":"B"} | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":"B"} | subscribe(inner#1) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 8 | 6 | CONCATALL-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | downstream.N("b1") | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 9 | 7 | CONCATALL-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | unsubscribe(inner#1); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 4 | 5 | 5 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"A"} | {"type":"callback.return","resource":{"id":"identity","generation":0},"value":"A"} | {"type":"outer.next","value":"B"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"callback.return","resource":{"id":"identity","generation":1},"value":"B"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":["B"]} | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":"B"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N("a1") | none | none | downstream.N("b1") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
