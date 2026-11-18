# throwIfEmpty-custom: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S20-THROWIFEMPTY-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Listening","hasValue":false} |
| 1 | 4 | S20-THROWIFEMPTY-COMPLETE-EMPTY | {"type":"source.complete"} | {"phase":"Listening","hasValue":false} | invoke(errorFactory#0, value=undefined, index=0) | {"phase":"CreatingError"} |
| 2 | 4 | S20-THROWIFEMPTY-FACTORY-RETURN | {"type":"callback.return","resource":{"id":"errorFactory","generation":0},"value":"empty-source"} | {"phase":"CreatingError"} | downstream.E("empty-source"); unsubscribe(source#0) | {"phase":"Closed","reason":"error"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 |
|---|---|---|---|
| Time | 0 | 4 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.complete"} | {"type":"callback.return","resource":{"id":"errorFactory","generation":0},"value":"empty-source"} |
| Control / state | {"phase":"Listening","hasValue":false} | {"phase":"CreatingError"} | {"phase":"Closed","reason":"error"} |
| Output notifications | none | none | downstream.E("empty-source") |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
