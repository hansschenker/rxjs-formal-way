# publish-legacy-fixed-subject: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|
| 0 | 0 | S16-PUBLISH-JOIN-READY | {"type":"observer.subscribe","observer":0} | {"phase":"Ready","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":null} | subscribe(observer#0) | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} |
| 1 | 1 | S16-PUBLISH-CONNECT | {"type":"connect"} | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | subscribe(source#0) | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} |
| 2 | 2 | S16-PUBLISH-SOURCE-NEXT | {"type":"source.next","resource":{"id":"source","generation":0},"value":5} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | observer-0.N(5) | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} |
| 3 | 3 | S16-PUBLISH-JOIN-CONNECTED | {"type":"observer.subscribe","observer":1} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | subscribe(observer#1) | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"hasLast":false,"terminal":null} |
| 4 | 4 | S16-PUBLISH-SOURCE-COMPLETE | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"hasLast":false,"terminal":null} | unsubscribe(source#0); observer-0.C(); observer-1.C() | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":"complete"} |
| 5 | 5 | S16-PUBLISH-LATE-SUBSCRIBE | {"type":"observer.subscribe","observer":2} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":"complete"} | observer-2.C() | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 |
|---|---|---|---|---|---|---|
| Time | 0 | 1 | 2 | 3 | 4 | 5 |
| Input | {"type":"observer.subscribe","observer":0} | {"type":"connect"} | {"type":"source.next","resource":{"id":"source","generation":0},"value":5} | {"type":"observer.subscribe","observer":1} | {"type":"source.complete","resource":{"id":"source","generation":0}} | {"type":"observer.subscribe","observer":2} |
| Control / state | {"phase":"Ready","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | {"phase":"Connected","subscribers":[0],"generation":0,"retained":[],"hasLast":false,"terminal":null} | {"phase":"Connected","subscribers":[0,1],"generation":0,"retained":[],"hasLast":false,"terminal":null} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":"complete"} | {"phase":"Stopped","subscribers":[],"generation":0,"retained":[],"hasLast":false,"terminal":"complete"} |
| Output notifications | none | none | observer-0.N(5) | none | observer-0.C(); observer-1.C() | observer-2.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
