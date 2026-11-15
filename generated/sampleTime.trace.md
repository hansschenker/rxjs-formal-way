# sampleTime-source-first-3: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S18-SAMPLETIME-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0); schedule(periodic#0, delay=3) | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":3} |
| 1 | 1 | S18-SAMPLETIME-REMEMBER | {"type":"source.next","value":"before tick"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":3} |  | {"phase":"Listening","hasValue":true,"lastValue":"before tick","notifier":"open","tick":0,"due":3} |
| 2 | 3 | S18-SAMPLETIME-TICK-EMIT | {"type":"timer.fire","resource":{"id":"periodic","generation":0},"now":3} | {"phase":"Listening","hasValue":true,"lastValue":"before tick","notifier":"open","tick":0,"due":3} | downstream.N("before tick"); schedule(periodic#1, delay=3) | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":1,"due":6} |
| 3 | 4 | S18-SAMPLETIME-REMEMBER | {"type":"source.next","value":"after tick"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":1,"due":6} |  | {"phase":"Listening","hasValue":true,"lastValue":"after tick","notifier":"open","tick":1,"due":6} |
| 4 | 6 | S18-SAMPLETIME-TICK-EMIT | {"type":"timer.fire","resource":{"id":"periodic","generation":1},"now":6} | {"phase":"Listening","hasValue":true,"lastValue":"after tick","notifier":"open","tick":1,"due":6} | downstream.N("after tick"); schedule(periodic#2, delay=3) | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":2,"due":9} |
| 5 | 7 | S18-SAMPLETIME-COMPLETE | {"type":"source.complete"} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":2,"due":9} | downstream.C(); unsubscribe(source#0); cancel-timer(periodic#2) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 3 | 4 | 6 | 7 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"before tick"} | {"type":"timer.fire","resource":{"id":"periodic","generation":0},"now":3} | {"type":"source.next","value":"after tick"} | {"type":"timer.fire","resource":{"id":"periodic","generation":1},"now":6} | {"type":"source.complete"} |
| Control / state | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":0,"due":3} | {"phase":"Listening","hasValue":true,"lastValue":"before tick","notifier":"open","tick":0,"due":3} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":1,"due":6} | {"phase":"Listening","hasValue":true,"lastValue":"after tick","notifier":"open","tick":1,"due":6} | {"phase":"Listening","hasValue":false,"lastValue":null,"notifier":"open","tick":2,"due":9} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | downstream.N("before tick") | none | downstream.N("after tick") | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
