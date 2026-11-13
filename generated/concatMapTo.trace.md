# concatMapTo-constant-Observable: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | CONCATMAPTO-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | CONCATMAPTO-ADMIT | {"type":"outer.next","value":1} | {"phase":"Active","index":0,"active":[],"queue":[]} | invoke(constant#0, value=1, index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} |
| 2 | 1 | CONCATMAPTO-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"constant","generation":0},"value":"shared"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} |
| 3 | 2 | CONCATMAPTO-QUEUE | {"type":"outer.next","value":2} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} |  | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} |
| 4 | 3 | CONCATMAPTO-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | unsubscribe(outer#0) | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} |
| 5 | 4 | CONCATMAPTO-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a"} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | downstream.N("a") | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} |
| 6 | 5 | CONCATMAPTO-DRAIN-DRAINING | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | unsubscribe(inner#0); invoke(constant#1, value=2, index=1) | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":2} |
| 7 | 5 | CONCATMAPTO-RETURN-DRAINING | {"type":"callback.return","resource":{"id":"constant","generation":1},"value":"shared"} | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":2} | subscribe(inner#1) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} |
| 8 | 6 | CONCATMAPTO-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | downstream.N("b") | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} |
| 9 | 7 | CONCATMAPTO-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | unsubscribe(inner#1); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 4 | 5 | 5 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":1} | {"type":"callback.return","resource":{"id":"constant","generation":0},"value":"shared"} | {"type":"outer.next","value":2} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"a"} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"callback.return","resource":{"id":"constant","generation":1},"value":"shared"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"b"} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | {"phase":"Draining","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[2]} | {"phase":"Calling","resume":"Draining","index":2,"active":[],"queue":[],"callId":1,"input":2} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N("a") | none | none | downstream.N("b") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
