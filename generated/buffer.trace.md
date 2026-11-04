# buffer-Observable-closing-notifier: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | BUFFER-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0); subscribe(closing-notifier#0) | {"phase":"Active","seen":0,"notifierLive":true,"records":[{"start":0,"values":[]}]} |
| 1 | 1 | BUFFER-NEXT | {"type":"source.next","value":1} | {"phase":"Active","seen":0,"notifierLive":true,"records":[{"start":0,"values":[]}]} |  | {"phase":"Active","seen":1,"notifierLive":true,"records":[{"start":0,"values":[1]}]} |
| 2 | 2 | BUFFER-NEXT | {"type":"source.next","value":2} | {"phase":"Active","seen":1,"notifierLive":true,"records":[{"start":0,"values":[1]}]} |  | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":0,"values":[1,2]}]} |
| 3 | 3 | BUFFER-NOTIFIER-NEXT | {"type":"notifier.next"} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":0,"values":[1,2]}]} | downstream.N([1,2]) | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} |
| 4 | 4 | BUFFER-NOTIFIER-NEXT | {"type":"notifier.next"} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} | downstream.N([]) | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} |
| 5 | 5 | BUFFER-NEXT | {"type":"source.next","value":3} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} |  | {"phase":"Active","seen":3,"notifierLive":true,"records":[{"start":2,"values":[3]}]} |
| 6 | 6 | BUFFER-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","seen":3,"notifierLive":true,"records":[{"start":2,"values":[3]}]} | downstream.N([3]); downstream.C(); unsubscribe(source#0); unsubscribe(closing-notifier#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 |
|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"source.next","value":2} | {"type":"notifier.next"} | {"type":"notifier.next"} | {"type":"source.next","value":3} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","seen":0,"notifierLive":true,"records":[{"start":0,"values":[]}]} | {"phase":"Active","seen":1,"notifierLive":true,"records":[{"start":0,"values":[1]}]} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":0,"values":[1,2]}]} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} | {"phase":"Active","seen":2,"notifierLive":true,"records":[{"start":2,"values":[]}]} | {"phase":"Active","seen":3,"notifierLive":true,"records":[{"start":2,"values":[3]}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N([1,2]) | downstream.N([]) | none | downstream.N([3]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
