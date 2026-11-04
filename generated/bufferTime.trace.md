# bufferTime-3-restart: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | BUFFERTIME-INIT | {"type":"subscribe","now":0} | {"phase":"Unsubscribed"} | schedule(buffer-window#0, delay=3); subscribe(source#0) | {"phase":"Active","now":0,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[]}],"creationAt":null,"creation":null} |
| 1 | 1 | BUFFERTIME-NEXT | {"type":"source.next","now":1,"value":1} | {"phase":"Active","now":0,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[]}],"creationAt":null,"creation":null} |  | {"phase":"Active","now":1,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1]}],"creationAt":null,"creation":null} |
| 2 | 2 | BUFFERTIME-NEXT | {"type":"source.next","now":2,"value":2} | {"phase":"Active","now":1,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1]}],"creationAt":null,"creation":null} |  | {"phase":"Active","now":2,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1,2]}],"creationAt":null,"creation":null} |
| 3 | 3 | BUFFERTIME-WINDOW-FIRE | {"type":"window.fire","now":3,"resource":{"id":"buffer-window","generation":0}} | {"phase":"Active","now":2,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1,2]}],"creationAt":null,"creation":null} | cancel-timer(buffer-window#0); downstream.N([1,2]); schedule(buffer-window#1, delay=3) | {"phase":"Active","now":3,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[]}],"creationAt":null,"creation":null} |
| 4 | 4 | BUFFERTIME-NEXT | {"type":"source.next","now":4,"value":3} | {"phase":"Active","now":3,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[]}],"creationAt":null,"creation":null} |  | {"phase":"Active","now":4,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[3]}],"creationAt":null,"creation":null} |
| 5 | 5 | BUFFERTIME-SOURCE-COMPLETE | {"type":"source.complete","now":5} | {"phase":"Active","now":4,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[3]}],"creationAt":null,"creation":null} | downstream.N([3]); downstream.C(); cancel-timer(buffer-window#1); unsubscribe(source#0) | {"phase":"Closed","now":5,"reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe","now":0} | {"type":"source.next","now":1,"value":1} | {"type":"source.next","now":2,"value":2} | {"type":"window.fire","now":3,"resource":{"id":"buffer-window","generation":0}} | {"type":"source.next","now":4,"value":3} | {"type":"source.complete","now":5} |
| Control / state | {"phase":"Active","now":0,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[]}],"creationAt":null,"creation":null} | {"phase":"Active","now":1,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1]}],"creationAt":null,"creation":null} | {"phase":"Active","now":2,"nextWindowId":1,"nextCreationId":0,"windows":[{"id":0,"startedAt":0,"closesAt":3,"values":[1,2]}],"creationAt":null,"creation":null} | {"phase":"Active","now":3,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[]}],"creationAt":null,"creation":null} | {"phase":"Active","now":4,"nextWindowId":2,"nextCreationId":0,"windows":[{"id":1,"startedAt":3,"closesAt":6,"values":[3]}],"creationAt":null,"creation":null} | {"phase":"Closed","now":5,"reason":"complete"} |
| Output notifications | none | none | none | downstream.N([1,2]) | none | downstream.N([3]); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
