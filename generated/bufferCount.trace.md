# bufferCount-3-every-2: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | BUFFERCOUNT-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","seen":0,"notifierLive":false,"records":[]} |
| 1 | 1 | BUFFERCOUNT-NEXT | {"type":"source.next","value":1} | {"phase":"Active","seen":0,"notifierLive":false,"records":[]} |  | {"phase":"Active","seen":1,"notifierLive":false,"records":[{"start":0,"values":[1]}]} |
| 2 | 2 | BUFFERCOUNT-NEXT | {"type":"source.next","value":2} | {"phase":"Active","seen":1,"notifierLive":false,"records":[{"start":0,"values":[1]}]} |  | {"phase":"Active","seen":2,"notifierLive":false,"records":[{"start":0,"values":[1,2]}]} |
| 3 | 3 | BUFFERCOUNT-NEXT | {"type":"source.next","value":3} | {"phase":"Active","seen":2,"notifierLive":false,"records":[{"start":0,"values":[1,2]}]} | downstream.N([1,2,3]) | {"phase":"Active","seen":3,"notifierLive":false,"records":[{"start":2,"values":[3]}]} |
| 4 | 4 | BUFFERCOUNT-NEXT | {"type":"source.next","value":4} | {"phase":"Active","seen":3,"notifierLive":false,"records":[{"start":2,"values":[3]}]} |  | {"phase":"Active","seen":4,"notifierLive":false,"records":[{"start":2,"values":[3,4]}]} |
| 5 | 5 | BUFFERCOUNT-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","seen":4,"notifierLive":false,"records":[{"start":2,"values":[3,4]}]} | downstream.N([3,4]); downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":1} | {"type":"source.next","value":2} | {"type":"source.next","value":3} | {"type":"source.next","value":4} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","seen":0,"notifierLive":false,"records":[]} | {"phase":"Active","seen":1,"notifierLive":false,"records":[{"start":0,"values":[1]}]} | {"phase":"Active","seen":2,"notifierLive":false,"records":[{"start":0,"values":[1,2]}]} | {"phase":"Active","seen":3,"notifierLive":false,"records":[{"start":2,"values":[3]}]} | {"phase":"Active","seen":4,"notifierLive":false,"records":[{"start":2,"values":[3,4]}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N([1,2,3]) | none | downstream.N([3,4]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
