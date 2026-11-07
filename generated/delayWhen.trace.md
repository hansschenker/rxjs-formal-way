# delayWhen-Observable-selectors: concrete trace and four-lane view

> Generated from the canonical model by npm run generate. Do not edit this projection.

**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.

| Sequence | Time | Rule | Input | Before | Ordered actions | After |
|---:|---:|---|---|---|---|---|
| 0 | 0 | DELAYWHEN-INIT | {"type":"subscribe"} | {"phase":"Unsubscribed"} | subscribe(source#0) | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} |
| 1 | 1 | DELAYWHEN-SOURCE-SELECT | {"type":"source.next","now":1,"value":1} | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} | invoke(selector#0, value=1, index=0) | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"calling"}]} |
| 2 | 1 | DELAYWHEN-SELECTOR-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"calling"}]} | subscribe(duration#0) | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending"}]} |
| 3 | 2 | DELAYWHEN-SOURCE-SELECT | {"type":"source.next","now":2,"value":2} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending"}]} | invoke(selector#1, value=2, index=1) | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"calling"}]} |
| 4 | 2 | DELAYWHEN-SELECTOR-RETURN | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"calling"}]} | subscribe(duration#1) | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} |
| 5 | 3 | DELAYWHEN-SOURCE-COMPLETE-WAIT | {"type":"source.complete"} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} | unsubscribe(source#0) | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} |
| 6 | 4 | DELAYWHEN-DURATION-EMPTY-Active | {"type":"duration.complete","resource":{"id":"duration","generation":0}} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} | unsubscribe(duration#0) | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending"}]} |
| 7 | 5 | DELAYWHEN-DURATION-NEXT-Closed | {"type":"duration.next","resource":{"id":"duration","generation":1}} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending"}]} | unsubscribe(duration#1); downstream.N(2); downstream.C() | {"phase":"Closed","reason":"complete"} |

## Four lanes

| Lane | step 0 | step 1 | step 2 | step 3 | step 4 | step 5 | step 6 | step 7 |
|---|---|---|---|---|---|---|---|---|
| Time | 0 | 1 | 1 | 2 | 2 | 3 | 4 | 5 |
| Input | {"type":"subscribe"} | {"type":"source.next","now":1,"value":1} | {"type":"callback.return","resource":{"id":"selector","generation":0}} | {"type":"source.next","now":2,"value":2} | {"type":"callback.return","resource":{"id":"selector","generation":1}} | {"type":"source.complete"} | {"type":"duration.complete","resource":{"id":"duration","generation":0}} | {"type":"duration.next","resource":{"id":"duration","generation":1}} |
| Control / state | {"phase":"Active","sourceLive":true,"nextId":0,"items":[]} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"calling"}]} | {"phase":"Active","sourceLive":true,"nextId":1,"items":[{"id":0,"value":1,"stage":"pending"}]} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"calling"}]} | {"phase":"Active","sourceLive":true,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":0,"value":1,"stage":"pending"},{"id":1,"value":2,"stage":"pending"}]} | {"phase":"Active","sourceLive":false,"nextId":2,"items":[{"id":1,"value":2,"stage":"pending"}]} | {"phase":"Closed","reason":"complete"} |
| Output notifications | none | none | none | none | none | none | none | downstream.N(2); downstream.C() |

The ordered-action column retains lifecycle observations omitted from the output-notification lane.
