# startWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Before subscribing to source, synchronously emit all supplied prefix values in order, then forward source notifications.

**Scope:** A finite frozen snapshot of supplied prefix values; no SchedulerLike argument.. Atomic non-reentrant prefix microsteps and source delivery; supports downstream cancellation between prefix emissions.

**Dataflow shape:** `startWith(P*) : T* -> (P + T)*`. Successful output begins with exactly the supplied prefix word, followed by the source word. Prefix is not replayed in addition to each source value; cancellation during prefix prevents source acquisition.

<!-- STARTWITH-INIT-EMPTY -->
Without prefix values, the source is subscribed to immediately and is forwarded unchanged.

<!-- STARTWITH-INIT-PREFIX -->
At subscription, startWith emits its supplied values before connecting to the source. Construction of the pipeline is lazy.

<!-- STARTWITH-EMIT -->
Each configured prefix value is forwarded in argument order, including undefined, null and repeated values. It is emitted synchronously in the default unscheduled profile.

<!-- STARTWITH-CONNECT -->
Only after the entire prefix sequence completes does startWith subscribe to the source. An observer that cancels during the prefix prevents source acquisition.

<!-- STARTWITH-CANCEL-PREFIX -->
Cancellation during prefix delivery suppresses remaining prefix values and prevents the source from ever being subscribed.

<!-- STARTWITH-NEXT -->
After the prefix, all source values flow unchanged in their original order and arrival times.

<!-- STARTWITH-COMPLETE -->
Once prefix delivery and the source finish, the output completes. An empty source still receives all prefix values first.

<!-- STARTWITH-ERROR -->
A source error arrives only after the prefix has been emitted. It passes through unchanged; no completion follows.

<!-- STARTWITH-CANCEL-ACTIVE -->
Cancellation after prefix completion releases the source and stops future values without synthesizing completion.

**Time:** Unscheduled prefix values are synchronous on subscription; source time begins only when subscribed. No internal clock or timer.

**Sharing:** No multicasting. Each result subscription repeats prefix and owns its own source subscription.

**Callbacks:** No user projection. Prefix values are opaque and forwarded without inspection.

**Excluded:** Deprecated SchedulerLike overload, which uses scheduling and changes when the source is subscribed. Throwing observer/finalizer, nested synchronous reentry or guaranteed physical producer abort.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-04.md) is reported separately from this specification.
