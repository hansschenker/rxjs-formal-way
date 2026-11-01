# distinctUntilChanged: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward the first item and later items whose selected key differs from the previous FORWARDED key.

**Scope:** Key mode identity, comparator mode strict.. Non-reentrant source and observer delivery; only plain stable property values are modeled for distinctUntilKeyChanged.

**Dataflow shape:** `distinctUntilChanged : T* -> T*`. At most one original value is emitted per source value. The first is emitted if its key selection succeeds. Errors and cancellation may truncate output; comparator equality is not suppression based on every past key.

<!-- DISTINCTUNTILCHANGED-INIT -->
Subscription starts one independent comparison history. No values are emitted until the source sends one.

<!-- DISTINCTUNTILCHANGED-SELECT -->
Every source value selects a key, including the first and every value later suppressed. Without a user selector this is an identity or property-access microstep; it is not an extra RxJS event or asynchronous task.

<!-- DISTINCTUNTILCHANGED-FIRST -->
The first source value is always forwarded; its selected key is saved before the notification is sent. A key selector, when configured, still runs for this first value.

<!-- DISTINCTUNTILCHANGED-COMPARE -->
Subsequent source values compare with the key of the last FORWARDED value, not necessarily the immediately preceding input. The comparator receives previous key first, current key second.

<!-- DISTINCTUNTILCHANGED-CHANGE -->
When the comparator says the keys differ, forward the original value and replace the remembered key before downstream delivery.

<!-- DISTINCTUNTILCHANGED-SAME -->
When the comparator says equal, emit nothing and do not replace the previous emitted key. Future values compare against the last value actually forwarded.

<!-- DISTINCTUNTILCHANGED-SELECT-ERROR -->
If selecting the key throws, forward the exact error and release the source. No input value or completion follows.

<!-- DISTINCTUNTILCHANGED-COMPARE-ERROR -->
A comparator error terminates the stream immediately and releases the source without a final value.

<!-- DISTINCTUNTILCHANGED-COMPLETE -->
Source completion forwards completion without emitting a stored value, then releases the source subscription.

<!-- DISTINCTUNTILCHANGED-ERROR -->
A source error passes through unchanged, then source resources are released; no completion follows.

<!-- DISTINCTUNTILCHANGED-CANCEL -->
Downstream cancellation releases source ownership without producing a completion notification.

**Time:** No timers or scheduler introduced. Inputs supply timestamps and tie order; key and comparator microsteps resolve synchronously at the same time.

**Sharing:** Does not multicast. Each result subscription owns its own last-emitted key.

**Callbacks:** Key selection and comparator outcomes are external correlated microsteps, not functions executed inside model guards. Default identity/property selection and strict comparison are synthetic model steps, not physical user callback calls.

**Excluded:** Arbitrary reentrant observer/callback behavior and subscriber cancellation DURING an unresolved callback. Mutation/getter side effects between property comparisons, prototype proxies or throwing property access unless represented as explicit key errors. Unbounded invocation-counter overflow, a production callback effect interpreter, deprecated overloads not selected here.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-04.md) is reported separately from this specification.
