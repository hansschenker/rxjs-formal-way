# onErrorResumeNext: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Sequentially forward the original and later Observable sources, moving to the next on either completion or error.

**Scope:** Pipeable deprecated onErrorResumeNext alias of onErrorResumeNextWith; 2 other valid Observable sources, no promises or iterables.. Atomic nonreentrant source terminal steps and subscription acquisition.

**Dataflow shape:** `onErrorResumeNext : T0* × ... × Tn* → (T0 | ... | Tn)*`. Exactly one input is subscribed at a time; values retain identity and order within an input. Either completion or error of a current input starts the next supplied source. When the final input completes or errors, emit a normal result completion; never emit an error notification.

<!-- S15-ONERRORRESUMENEXT-INIT -->
The pipeable export subscribes the original source first and defers every later source.

<!-- S15-ONERRORRESUMENEXT-NEXT -->
Only the currently subscribed input may contribute next values.

<!-- S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE -->
Both completion and error advance to the next input; errors are deliberately swallowed.

<!-- S15-ONERRORRESUMENEXT-COMPLETE-LAST -->
An error from the last input also produces normal completion, never an output error.

<!-- S15-ONERRORRESUMENEXT-ERROR-ADVANCE -->
Both completion and error advance to the next input; errors are deliberately swallowed.

<!-- S15-ONERRORRESUMENEXT-ERROR-LAST -->
An error from the last input also produces normal completion, never an output error.

<!-- S15-ONERRORRESUMENEXT-CANCEL -->
Cancellation drops all unstarted inputs, never resuming after an explicit unsubscribe.

**Time:** Only active source notifications determine time; no timer. Sequential resource acquisition is synchronous in each terminal reaction.

**Sharing:** No sharing; one input active per result subscription.

**Callbacks:** No callbacks or inspection of error values. Error details are intentionally discarded.

**Excluded:** Synchronous reentrant emission during subscription acquisition; arbitrary ObservableInput conversions and conversion throws. Unbounded argument counts over 32; any user observer callback reentry or throwing teardown.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-15.md) is reported separately from this specification.
