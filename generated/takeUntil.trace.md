# takeUntil-Observable-notifier: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | TAKEUNTIL-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(notifier#0) | {"phase":"Starting","open":true,"notifierLive":true} |
| 1 | 0 | TAKEUNTIL-SOURCE-CONNECT | {"type":"setup.ready"} | {"phase":"Starting","open":true,"notifierLive":true} | subscribe(source#0) | {"phase":"Active","open":true,"notifierLive":true} |
| 2 | 1 | TAKEUNTIL-PASS | {"type":"source.next","value":"a"} | {"phase":"Active","open":true,"notifierLive":true} | downstream.N("a") | {"phase":"Active","open":true,"notifierLive":true} |
| 3 | 2 | TAKEUNTIL-PASS | {"type":"source.next","value":"b"} | {"phase":"Active","open":true,"notifierLive":true} | downstream.N("b") | {"phase":"Active","open":true,"notifierLive":true} |
| 4 | 3 | TAKEUNTIL-LIVE-NOTIFIER-NEXT | {"type":"notifier.next","resource":{"id":"notifier","generation":0},"value":false} | {"phase":"Active","open":true,"notifierLive":true} | downstream.C(); unsubscribe(notifier#0); unsubscribe(source#0) | {"phase":"Closed","reason":"notifier-next"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 0 | 1 | 2 | 3 |
| Input | {"type":"subscribe"} | {"type":"setup.ready"} | {"type":"source.next","value":"a"} | {"type":"source.next","value":"b"} | {"type":"notifier.next","resource":{"id":"notifier","generation":0},"value":false} |
| Control / state | {"phase":"Starting","open":true,"notifierLive":true} | {"phase":"Active","open":true,"notifierLive":true} | {"phase":"Active","open":true,"notifierLive":true} | {"phase":"Active","open":true,"notifierLive":true} | {"phase":"Closed","reason":"notifier-next"} |
| Output notifications | none | none | downstream.N("a") | downstream.N("b") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
