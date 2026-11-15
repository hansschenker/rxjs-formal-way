# sample-source-first-notifier: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S18-SAMPLE-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0); subscribe(notifier#0) | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |
| 1 | 1 | S18-SAMPLE-REMEMBER | {"type":"source.next","value":"old"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |  | {"phase":"Listening","hasValue":true,"lastValue":"old","notifier":"open","tick":0,"due":0} |
| 2 | 2 | S18-SAMPLE-REMEMBER | {"type":"source.next","value":"latest"} | {"phase":"Listening","hasValue":true,"lastValue":"old","notifier":"open","tick":0,"due":0} |  | {"phase":"Listening","hasValue":true,"lastValue":"latest","notifier":"open","tick":0,"due":0} |
| 3 | 3 | S18-SAMPLE-NOTIFIER-EMIT | {"type":"notifier.next"} | {"phase":"Listening","hasValue":true,"lastValue":"latest","notifier":"open","tick":0,"due":0} | downstream.N("latest") | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |
| 4 | 4 | S18-SAMPLE-NOTIFIER-EMPTY | {"type":"notifier.next"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |  | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |
| 5 | 5 | S18-SAMPLE-REMEMBER | {"type":"source.next","value":"discarded"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} |  | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"open","tick":0,"due":0} |
| 6 | 6 | S18-SAMPLE-NOTIFIER-COMPLETE | {"type":"notifier.complete"} | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"open","tick":0,"due":0} | unsubscribe(notifier#0) | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"completed","tick":0,"due":0} |
| 7 | 7 | S18-SAMPLE-COMPLETE | {"type":"source.complete"} | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"completed","tick":0,"due":0} | downstream.C(); unsubscribe(source#0) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 |
|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"old"} | {"type":"source.next","value":"latest"} | {"type":"notifier.next"} | {"type":"notifier.next"} | {"type":"source.next","value":"discarded"} | {"type":"notifier.complete"} | {"type":"source.complete"} |
| Control / state | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":true,"lastValue":"old","notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":true,"lastValue":"latest","notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"open","tick":0,"due":0} | {"phase":"Listening","hasValue":true,"lastValue":"discarded","notifier":"completed","tick":0,"due":0} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | downstream.N("latest") | none | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
