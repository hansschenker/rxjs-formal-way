# publishBehavior-legacy-fixed-subject: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S16-PUBLISHBEHAVIOR-JOIN-READY | {"type":"observer.subscribe","observer":0} | {"phase":"Ready","subscribers":[],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} | subscribe(observer#0); observer-0.N(0) | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} |
| 1 | 1 | S16-PUBLISHBEHAVIOR-CONNECT | {"type":"connect"} | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} | subscribe(source#0) | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} |
| 2 | 2 | S16-PUBLISHBEHAVIOR-SOURCE-NEXT | {"type":"source.next","resource":{"id":"source","generation":0},"value":5} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} | observer-0.N(5) | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} |
| 3 | 3 | S16-PUBLISHBEHAVIOR-JOIN-CONNECTED | {"type":"observer.subscribe","observer":1} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} | subscribe(observer#1); observer-1.N(5) | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} |
| 4 | 4 | S16-PUBLISHBEHAVIOR-SOURCE-COMPLETE | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} | unsubscribe(source#0); observer-0.C(); observer-1.C() | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":"complete"} |
| 5 | 5 | S16-PUBLISHBEHAVIOR-LATE-SUBSCRIBE | {"type":"observer.subscribe","observer":2} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":"complete"} | observer-2.C() | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"observer.subscribe","observer":0} | {"type":"connect"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":5} | {"type":"observer.subscribe","observer":1} | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"type":"observer.subscribe","observer":2} |
| Control / state | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":0,"hasLast":true,"terminal":null} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":null} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":"complete"} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"last":5,"hasLast":true,"terminal":"complete"} |
| Output notifications | observer-0.N(0) | none | observer-0.N(5) | observer-1.N(5) | observer-0.C(); observer-1.C() | observer-2.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
