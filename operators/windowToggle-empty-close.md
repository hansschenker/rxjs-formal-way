# windowToggle: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Open live multicast windows from an opening signal and close each from its own selector-created signal.

**Scope:** Valid Observable opening signal; synchronous closingSelector returns a valid Observable. Fresh safe-integer window generations.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `Cω: windowToggle : (O* × (O! → C*)) → T* → (T*)*`. No initial window; each successful opening reaction announces one handle. Source values go to every currently open window; opening and closing payloads are control inputs. Closing next closes its own window; closing complete only disconnects that signal. Source/closing/selector failure errors current windows; opening failure disposes them silently.

<!-- S22-WINDOWTOGGLE-START -->
Openings are acquired before source. Construction is inert; only opening next can request a window.

<!-- S22-WINDOWTOGGLE-OPEN -->
The implementation creates its Subject before calling the selector, but announces it only after successful conversion.

<!-- S22-WINDOWTOGGLE-SELECTOR-RETURN -->
The outcome abstracts the valid Observable result; its subscription occurrence is identified by the window generation.

<!-- S22-WINDOWTOGGLE-SELECTOR-THROW -->
The private new Subject is failed too, but no public observer can attach to that unannounced identity.

<!-- S22-WINDOWTOGGLE-SOURCE-NEXT -->
No current windows means the source value is dropped. Windows multicast live values without replay or buffering.

<!-- S22-WINDOWTOGGLE-CLOSING-NEXT -->
A closing value is a control signal; it is not forwarded as a source value.

<!-- S22-WINDOWTOGGLE-CLOSING-COMPLETE -->
RxJS 7.8.2 installs noop for closing completion. Empty completion does not close a window.

<!-- S22-WINDOWTOGGLE-OPENING-COMPLETE -->
Opening completion is not output completion and does not implicitly close any current window.

<!-- S22-WINDOWTOGGLE-SOURCE-ERROR -->
Source and closing errors use handleError, which drains the window array before source finalization.

<!-- S22-WINDOWTOGGLE-CLOSING-ERROR -->
Source and closing errors use handleError, which drains the window array before source finalization.

<!-- S22-WINDOWTOGGLE-SOURCE-COMPLETE -->
The implementation removes each Subject from its active array before completing the outer result.

<!-- S22-WINDOWTOGGLE-OPENING-ERROR -->
Opening errors use the default subscriber path, not handleError. Current window consumers receive no error or complete.

<!-- S22-WINDOWTOGGLE-CANCEL -->
Subject.unsubscribe is not Subject.complete. Historical completed windows are not disposed.

<!-- S22-WINDOWTOGGLE-OBSERVE-OPEN -->
Window consumers share values only inside this outer execution; they do not own the source connection.

<!-- S22-WINDOWTOGGLE-OBSERVE-COMPLETE-ACTIVE -->
Only announced handles are addressable; a selector failure never exposes its private pending window.

<!-- S22-WINDOWTOGGLE-OBSERVER-CLOSE-ACTIVE -->
Orphaned consumers after disposal remain independently owned.

<!-- S22-WINDOWTOGGLE-OBSERVE-COMPLETE-STOPPED -->
Only announced handles are addressable; a selector failure never exposes its private pending window.

<!-- S22-WINDOWTOGGLE-OBSERVE-ERROR-STOPPED -->
Only announced handles are addressable; a selector failure never exposes its private pending window.

<!-- S22-WINDOWTOGGLE-OBSERVER-CLOSE-STOPPED -->
Orphaned consumers after disposal remain independently owned.

**Time:** No clock or timer. Sources supply time; input order resolves equal-time events. runWindowToggleTrace enforces selector outcome at invocation envelope time.

**Sharing:** Each outer connection owns its opening/source/closing subscriptions. Each window multicasts live values without replay; children hold no upstream lease.

**Callbacks:** Selector invocation carries the exact opening payload. Correlated return/throw is supplied synchronously; the model never executes user code.

**Excluded:** Setup-time synchronous opening/source/closing emissions and arbitrary callback/observer reentrancy. Foreign ObservableInput conversions, invalid closing-selector returns, direct Subject mutation and non-safe generation overflow. Late subscription to disposed handles throws synchronously and is characterized natively outside the legal model event alphabet. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-22-TOGGLE-WINDOWS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-22.md) is reported separately from this specification.
