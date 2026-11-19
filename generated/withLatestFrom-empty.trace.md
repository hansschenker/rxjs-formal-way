# withLatestFrom-2-tuple: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S22-WITHLATESTFROM-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(aux:0#0); subscribe(aux:1#0); subscribe(source#0) | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} |
| 1 | 1 | S22-WITHLATESTFROM-AUX-COMPLETE | {"type":"aux.complete","index":0} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} | unsubscribe(aux:0#0) | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[false,true],"ready":false} |
| 2 | 2 | S22-WITHLATESTFROM-AUX-NEXT | {"type":"aux.next","index":1,"value":"ready-on-one"} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[false,true],"ready":false} |  | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} |
| 3 | 3 | S22-WITHLATESTFROM-SOURCE-BLOCKED | {"type":"source.next","value":"discarded"} | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} |  | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} |
| 4 | 4 | S22-WITHLATESTFROM-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} | downstream.C(); unsubscribe(source#0); unsubscribe(aux:1#0) | {"phase":"Closed","reason":"source-complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 |
|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 |
| Input | {"type":"subscribe"} | {"type":"aux.complete","index":0} | {"type":"aux.next","index":1,"value":"ready-on-one"} | {"type":"source.next","value":"discarded"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[false,true],"ready":false} | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} | {"phase":"Active","latest":[null,"ready-on-one"],"hasValue":[false,true],"live":[false,true],"ready":false} | {"phase":"Closed","reason":"source-complete"} |
| Output notifications | none | none | none | none | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
