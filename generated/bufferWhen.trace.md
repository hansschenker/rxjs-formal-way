# bufferWhen-Observable-selector: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | BUFFERWHEN-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | invoke(selector#0, value=undefined, index=0) | {"phase":"Calling","sourceLive":false,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":false}],"pending":0} |
| 1 | 0 | BUFFERWHEN-CALLBACK-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"phase":"Calling","sourceLive":false,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":false}],"pending":0} | subscribe(closing#0); subscribe(source#0) | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":true}]} |
| 2 | 1 | BUFFERWHEN-SOURCE-NEXT | {"type":"source.next","value":1} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":true}]} |  | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1],"closingLive":true}]} |
| 3 | 2 | BUFFERWHEN-SOURCE-NEXT | {"type":"source.next","value":2} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1],"closingLive":true}]} |  | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1,2],"closingLive":true}]} |
| 4 | 3 | BUFFERWHEN-CLOSING-NEXT | {"type":"closing.next","resource":{"id":"closing","generation":0}} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1,2],"closingLive":true}]} | unsubscribe(closing#0); downstream.N([1,2]); invoke(selector#1, value=undefined, index=1) | {"phase":"Calling","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":false}],"pending":1} |
| 5 | 3 | BUFFERWHEN-CALLBACK-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"phase":"Calling","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":false}],"pending":1} | subscribe(closing#1) | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":true}]} |
| 6 | 4 | BUFFERWHEN-SOURCE-NEXT | {"type":"source.next","value":3} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":true}]} |  | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[3],"closingLive":true}]} |
| 7 | 5 | BUFFERWHEN-SOURCE-COMPLETE | {"type":"source.complete"} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[3],"closingLive":true}]} | downstream.N([3]); downstream.C(); unsubscribe(source#0); unsubscribe(closing#1) | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 |
|---|---|---|---|---|---|---|---|---|
| Time | 0 | 0 | 1 | 2 | 3 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"type":"source.next","value":1} | {"type":"source.next","value":2} | {"type":"closing.next","resource":{"id":"closing","generation":0}} | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"type":"source.next","value":3} | {"type":"source.complete"} |
| Control / state | {"phase":"Calling","sourceLive":false,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":false}],"pending":0} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[],"closingLive":true}]} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1],"closingLive":true}]} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":1,"records":[{"id":0,"values":[1,2],"closingLive":true}]} | {"phase":"Calling","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":false}],"pending":1} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[],"closingLive":true}]} | {"phase":"Active","sourceLive":true,"openingsLive":false,"nextId":2,"records":[{"id":1,"values":[3],"closingLive":true}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | downstream.N([1,2]) | none | none | downstream.N([3]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
