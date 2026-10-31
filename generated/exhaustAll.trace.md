# exhaustAll-1: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | EXHAUSTALL-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | EXHAUSTALL-ADMIT | {"type":"outer.next","value":"A"} | {"phase":"Active","index":0,"active":[],"queue":[]} | invoke(identity#0, value="A", index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} |
| 2 | 1 | EXHAUSTALL-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"identity","generation":0},"value":"A"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 3 | 2 | EXHAUSTALL-IGNORE | {"type":"outer.next","value":"ignored"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |  | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 4 | 3 | EXHAUSTALL-NEXT-ACTIVE | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | downstream.N("a1") | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} |
| 5 | 4 | EXHAUSTALL-INNER-END-ACTIVE | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | unsubscribe(inner#0) | {"phase":"Active","index":1,"active":[],"queue":[]} |
| 6 | 5 | EXHAUSTALL-ADMIT | {"type":"outer.next","value":"B"} | {"phase":"Active","index":1,"active":[],"queue":[]} | invoke(identity#1, value="B", index=1) | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"B"} |
| 7 | 5 | EXHAUSTALL-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"identity","generation":1},"value":"B"} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"B"} | subscribe(inner#1) | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 8 | 6 | EXHAUSTALL-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | unsubscribe(outer#0) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 9 | 7 | EXHAUSTALL-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | downstream.N("b1") | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} |
| 10 | 8 | EXHAUSTALL-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | downstream.C(); unsubscribe(inner#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 | step 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 4 | 5 | 5 | 6 | 7 | 8 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":"A"} | {"type":"callback.return","resource":{"id":"identity","generation":0},"value":"A"} | {"type":"outer.next","value":"ignored"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a1"} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"outer.next","value":"B"} | {"type":"callback.return","resource":{"id":"identity","generation":1},"value":"B"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b1"} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":"A"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"A"}],"queue":[]} | {"phase":"Active","index":1,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":"B"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"B"}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("a1") | none | none | none | none | downstream.N("b1") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
