# switchMapTo-constant: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | SWITCHMAPTO-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | SWITCHMAPTO-ADMIT | {"type":"outer.next","value":1} | {"phase":"Active","index":0,"active":[],"queue":[]} | invoke(constant#0, value=1, index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} |
| 2 | 1 | SWITCHMAPTO-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"constant","generation":0},"value":"shared"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} |
| 3 | 2 | SWITCHMAPTO-NEXT-ACTIVE | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"old"} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} | downstream.N("old") | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} |
| 4 | 3 | SWITCHMAPTO-REPLACE | {"type":"outer.next","value":2} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} | unsubscribe(inner#0); invoke(constant#1, value=2, index=1) | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2} |
| 5 | 3 | SWITCHMAPTO-RETURN-ACTIVE | {"type":"callback.return","resource":{"id":"constant","generation":1},"value":"shared"} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2} | subscribe(inner#1) | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} |
| 6 | 4 | SWITCHMAPTO-OUTER-WAIT | {"type":"outer.complete"} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | unsubscribe(outer#0) | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} |
| 7 | 5 | SWITCHMAPTO-NEXT-DRAINING | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"new"} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | downstream.N("new") | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} |
| 8 | 6 | SWITCHMAPTO-LAST-INNER | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | downstream.C(); unsubscribe(inner#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 |
|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 3 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":1} | {"type":"callback.return","resource":{"id":"constant","generation":0},"value":"shared"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":"old"} | {"type":"outer.next","value":2} | {"type":"callback.return","resource":{"id":"constant","generation":1},"value":"shared"} | {"type":"outer.complete"} | {"type":"inner.next","resource":{"id":"inner","generation":1},"value":"new"} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"callId":0,"input":1} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} | {"phase":"Active","index":1,"active":[{"resource":{"id":"inner","generation":0},"source":"shared"}],"queue":[]} | {"phase":"Calling","resume":"Active","index":2,"active":[],"queue":[],"callId":1,"input":2} | {"phase":"Active","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"resource":{"id":"inner","generation":1},"source":"shared"}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N("old") | none | none | none | downstream.N("new") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
