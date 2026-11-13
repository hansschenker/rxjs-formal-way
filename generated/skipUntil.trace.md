# skipUntil-Observable-notifier: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | SKIPUNTIL-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(notifier#0) | {"phase":"Starting","open":false,"notifierLive":true} |
| 1 | 0 | SKIPUNTIL-SOURCE-CONNECT | {"type":"setup.ready"} | {"phase":"Starting","open":false,"notifierLive":true} | subscribe(source#0) | {"phase":"Active","open":false,"notifierLive":true} |
| 2 | 1 | SKIPUNTIL-DROP | {"type":"source.next","value":"a"} | {"phase":"Active","open":false,"notifierLive":true} |  | {"phase":"Active","open":false,"notifierLive":true} |
| 3 | 2 | SKIPUNTIL-LIVE-NOTIFIER-NEXT | {"type":"notifier.next","resource":{"id":"notifier","generation":0},"value":false} | {"phase":"Active","open":false,"notifierLive":true} | unsubscribe(notifier#0) | {"phase":"Active","open":true,"notifierLive":false} |
| 4 | 3 | SKIPUNTIL-PASS | {"type":"source.next","value":"b"} | {"phase":"Active","open":true,"notifierLive":false} | downstream.N("b") | {"phase":"Active","open":true,"notifierLive":false} |
| 5 | 4 | SKIPUNTIL-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","open":true,"notifierLive":false} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"setup.ready"} | {"type":"source.next","value":"a"} | {"type":"notifier.next","resource":{"id":"notifier","generation":0},"value":false} | {"type":"source.next","value":"b"} | {"type":"source.complete"} |
| Control / state | {"phase":"Starting","open":false,"notifierLive":true} | {"phase":"Active","open":false,"notifierLive":true} | {"phase":"Active","open":false,"notifierLive":true} | {"phase":"Active","open":true,"notifierLive":false} | {"phase":"Active","open":true,"notifierLive":false} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N("b") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
