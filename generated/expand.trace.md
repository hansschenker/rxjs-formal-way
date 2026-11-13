# expand-unbounded: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | EXPAND-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(outer#0) | {"phase":"Active","index":0,"active":[],"queue":[]} |
| 1 | 1 | EXPAND-OUTER-ADMIT | {"type":"outer.next","value":1} | {"phase":"Active","index":0,"active":[],"queue":[]} | downstream.N(1); invoke(project#0, value=1, index=0) | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"value":1,"callId":0} |
| 2 | 1 | EXPAND-PROJECT-RETURN | {"type":"callback.return","resource":{"id":"project","generation":0},"value":"inner-0"} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"value":1,"callId":0} | subscribe(inner#0) | {"phase":"Active","index":1,"active":[{"id":"inner","generation":0}],"queue":[]} |
| 3 | 2 | EXPAND-INNER-ADMIT-ACTIVE | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":2} | {"phase":"Active","index":1,"active":[{"id":"inner","generation":0}],"queue":[]} | downstream.N(2); invoke(project#1, value=2, index=1) | {"phase":"Calling","resume":"Active","index":2,"active":[{"id":"inner","generation":0}],"queue":[],"value":2,"callId":1} |
| 4 | 2 | EXPAND-PROJECT-RETURN | {"type":"callback.return","resource":{"id":"project","generation":1},"value":"inner-1"} | {"phase":"Calling","resume":"Active","index":2,"active":[{"id":"inner","generation":0}],"queue":[],"value":2,"callId":1} | subscribe(inner#1) | {"phase":"Active","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} |
| 5 | 3 | EXPAND-OUTER-COMPLETE | {"type":"outer.complete"} | {"phase":"Active","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} | unsubscribe(outer#0) | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} |
| 6 | 4 | EXPAND-INNER-COMPLETE-DRAINING-MORE | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} | unsubscribe(inner#0) | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":1}],"queue":[]} |
| 7 | 5 | EXPAND-INNER-COMPLETE-DRAINING-LAST | {"type":"inner.complete","resource":{"id":"inner","generation":1}} | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":1}],"queue":[]} | unsubscribe(inner#1); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 |
|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"outer.next","value":1} | {"type":"callback.return","resource":{"id":"project","generation":0},"value":"inner-0"} | {"type":"inner.next","resource":{"id":"inner","generation":0},"value":2} | {"type":"callback.return","resource":{"id":"project","generation":1},"value":"inner-1"} | {"type":"outer.complete"} | {"type":"inner.complete","resource":{"id":"inner","generation":0}} | {"type":"inner.complete","resource":{"id":"inner","generation":1}} |
| Control / state | {"phase":"Active","index":0,"active":[],"queue":[]} | {"phase":"Calling","resume":"Active","index":1,"active":[],"queue":[],"value":1,"callId":0} | {"phase":"Active","index":1,"active":[{"id":"inner","generation":0}],"queue":[]} | {"phase":"Calling","resume":"Active","index":2,"active":[{"id":"inner","generation":0}],"queue":[],"value":2,"callId":1} | {"phase":"Active","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":0},{"id":"inner","generation":1}],"queue":[]} | {"phase":"Draining","index":2,"active":[{"id":"inner","generation":1}],"queue":[]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | none | downstream.N(2) | none | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
