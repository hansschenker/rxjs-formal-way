# catchError-one-Observable-replacement: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | CATCHERROR-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Source"} |
| 1 | 1 | CATCHERROR-SOURCE-NEXT | {"type":"source.next","value":1} | {"phase":"Source"} | downstream.N(1) | {"phase":"Source"} |
| 2 | 2 | CATCHERROR-SOURCE-ERROR | {"type":"source.error","error":"fail"} | {"phase":"Source"} | invoke(selector#0, value="fail", index=0) | {"phase":"Calling","originalError":"fail"} |
| 3 | 2 | CATCHERROR-SELECTOR-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":0},"replacement":"recovery"} | {"phase":"Calling","originalError":"fail"} | unsubscribe(source#0); subscribe(replacement#0) | {"phase":"Replacement"} |
| 4 | 3 | CATCHERROR-REPLACEMENT-NEXT | {"type":"replacement.next","value":"fallback"} | {"phase":"Replacement"} | downstream.N("fallback") | {"phase":"Replacement"} |
| 5 | 4 | CATCHERROR-REPLACEMENT-COMPLETE | {"type":"replacement.complete"} | {"phase":"Replacement"} | downstream.C(); unsubscribe(replacement#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"source.error","error":"fail"} | {"type":"callback.return","resource":{"id":"selector","generation":0},"replacement":"recovery"} | {"type":"replacement.next","value":"fallback"} | {"type":"replacement.complete"} |
| Control / state | {"phase":"Source"} | {"phase":"Source"} | {"phase":"Calling","originalError":"fail"} | {"phase":"Replacement"} | {"phase":"Replacement"} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | downstream.N(1) | none | none | downstream.N("fallback") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
