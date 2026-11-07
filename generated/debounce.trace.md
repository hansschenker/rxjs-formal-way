# debounce-Observable-duration: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DEBOUNCE-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","nextId":0} |
| 1 | 1 | DEBOUNCE-NEW-VALUE | {"type":"source.next","value":1} | {"phase":"Active","nextId":0} | invoke(selector#0, value=1, index=0) | {"phase":"Calling","nextId":1,"pending":{"id":0,"value":1,"live":false}} |
| 2 | 1 | DEBOUNCE-DURATION-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"phase":"Calling","nextId":1,"pending":{"id":0,"value":1,"live":false}} | subscribe(duration#0) | {"phase":"Active","nextId":1,"pending":{"id":0,"value":1,"live":true}} |
| 3 | 2 | DEBOUNCE-NEW-VALUE | {"type":"source.next","value":2} | {"phase":"Active","nextId":1,"pending":{"id":0,"value":1,"live":true}} | unsubscribe(duration#0); invoke(selector#1, value=2, index=1) | {"phase":"Calling","nextId":2,"pending":{"id":1,"value":2,"live":false}} |
| 4 | 2 | DEBOUNCE-DURATION-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"phase":"Calling","nextId":2,"pending":{"id":1,"value":2,"live":false}} | subscribe(duration#1) | {"phase":"Active","nextId":2,"pending":{"id":1,"value":2,"live":true}} |
| 5 | 3 | DEBOUNCE-DURATION-NEXT | {"type":"duration.next","resource":{"id":"duration","generation":1}} | {"phase":"Active","nextId":2,"pending":{"id":1,"value":2,"live":true}} | unsubscribe(duration#1); downstream.N(2) | {"phase":"Active","nextId":2} |
| 6 | 4 | DEBOUNCE-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","nextId":2} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"type":"source.next","value":2} | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"type":"duration.next","resource":{"id":"duration","generation":1}} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","nextId":0} | {"phase":"Calling","nextId":1,"pending":{"id":0,"value":1,"live":false}} | {"phase":"Active","nextId":1,"pending":{"id":0,"value":1,"live":true}} | {"phase":"Calling","nextId":2,"pending":{"id":1,"value":2,"live":false}} | {"phase":"Active","nextId":2,"pending":{"id":1,"value":2,"live":true}} | {"phase":"Active","nextId":2} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | downstream.N(2) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
