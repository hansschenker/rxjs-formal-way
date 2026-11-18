# tap-next: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-TAP-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Listening","invocation":0} |
| 1 | 1 | S20-TAP-NEXT-CALL | {"type":"source.next","value":"A"} | {"phase":"Listening","invocation":0} | invoke(tap.next#0, value="A", index=0) | {"phase":"Calling","hook":"next","pending":{"kind":"N","value":"A"},"invocation":0} |
| 2 | 1 | S20-TAP-NEXT-RETURN | {"type":"callback.return","resource":{"id":"tap.next","generation":0}} | {"phase":"Calling","hook":"next","pending":{"kind":"N","value":"A"},"invocation":0} | downstream.N("A") | {"phase":"Listening","invocation":1} |
| 3 | 3 | S20-TAP-CANCEL | {"type":"cancel"} | {"phase":"Listening","invocation":1} | unsubscribe(source#0) | {"phase":"Closed","reason":"cancel"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 |
|---|---|---|---|---|
| Time | 0 | 1 | 1 | 3 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"A"} | {"type":"callback.return","resource":{"id":"tap.next","generation":0}} | {"type":"cancel"} |
| Control / state | {"phase":"Listening","invocation":0} | {"phase":"Calling","hook":"next","pending":{"kind":"N","value":"A"},"invocation":0} | {"phase":"Listening","invocation":1} | {"phase":"Closed","reason":"cancel"} |
| Output notifications | none | none | downstream.N("A") | none |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
