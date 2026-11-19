# withLatestFrom-2-tuple: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S22-WITHLATESTFROM-START | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(aux:0#0); subscribe(aux:1#0); subscribe(source#0) | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} |
| 1 | 1 | S22-WITHLATESTFROM-SOURCE-BLOCKED | {"type":"source.next","value":"early"} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} |  | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} |
| 2 | 2 | S22-WITHLATESTFROM-AUX-NEXT | {"type":"aux.next","index":0,"value":"left"} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} |  | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} |
| 3 | 3 | S22-WITHLATESTFROM-SOURCE-BLOCKED | {"type":"source.next","value":"still-early"} | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} |  | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} |
| 4 | 4 | S22-WITHLATESTFROM-AUX-NEXT | {"type":"aux.next","index":1} | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} |  | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} |
| 5 | 5 | S22-WITHLATESTFROM-SOURCE-READY | {"type":"source.next","value":"first"} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} | downstream.N(["first","left",null]) | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} |
| 6 | 6 | S22-WITHLATESTFROM-AUX-COMPLETE | {"type":"aux.complete","index":1} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} | unsubscribe(aux:1#0) | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,false],"ready":true} |
| 7 | 7 | S22-WITHLATESTFROM-AUX-NEXT | {"type":"aux.next","index":0,"value":"new-left"} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,false],"ready":true} |  | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} |
| 8 | 8 | S22-WITHLATESTFROM-SOURCE-READY | {"type":"source.next","value":"second"} | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} | downstream.N(["second","new-left",null]) | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} |
| 9 | 9 | S22-WITHLATESTFROM-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} | downstream.C(); unsubscribe(source#0); unsubscribe(aux:0#0) | {"phase":"Closed","reason":"source-complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 | step 8 | step 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| Input | {"type":"subscribe"} | {"type":"source.next","value":"early"} | {"type":"aux.next","index":0,"value":"left"} | {"type":"source.next","value":"still-early"} | {"type":"aux.next","index":1} | {"type":"source.next","value":"first"} | {"type":"aux.complete","index":1} | {"type":"aux.next","index":0,"value":"new-left"} | {"type":"source.next","value":"second"} | {"type":"source.complete"} |
| Control / state | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} | {"phase":"Active","latest":[null,null],"hasValue":[false,false],"live":[true,true],"ready":false} | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} | {"phase":"Active","latest":["left",null],"hasValue":[true,false],"live":[true,true],"ready":false} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,true],"ready":true} | {"phase":"Active","latest":["left",null],"hasValue":[true,true],"live":[true,false],"ready":true} | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} | {"phase":"Active","latest":["new-left",null],"hasValue":[true,true],"live":[true,false],"ready":true} | {"phase":"Closed","reason":"source-complete"} |
| Output notifications | none | none | none | none | none | downstream.N(["first","left",null]) | none | none | downstream.N(["second","new-left",null]) | downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
