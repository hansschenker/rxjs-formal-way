# mergeWith refinement — rules, scenarios and independent evidence

This is a corrective review of one already-counted export, not Session 16, a second daily batch, or a claim that the entire catalogue has been re-reviewed. The original [Session 15](../evidence/SESSION-15.md) is retained as historical evidence. Current corrective verification belongs in [REFINEMENT-MERGEWITH](../evidence/REFINEMENT-MERGEWITH.md).

## What the comparison found

The public RxJS 7.8.2 mergeWith signature has no concurrency argument. Our initial specialization inherited every rule from the more general merge model, including REFILL. In the unbounded profile, initialization subscribes every input, pending starts empty and no reachable step makes it nonempty. REFILL was therefore not applicable to this profile even though it was rendered as an operator rule.

The same comparison exposed imprecise next-state wording and a final-completion action-order claim that was not established by the previous native tests. Source inspection places the normal final completion check in mergeInternals' onFinalize, after OperatorSubscriber has unsubscribed registered input teardown. The new tests observe that order directly; same-frame marble timestamps alone do not establish it.

## Canonical correction

The mergeWith wrapper now removes REFILL, and removes COMPLETE-WAIT when there are no additional inputs. Its validator rejects nonempty pending lists and mismatched input inventories. State descriptions say what actually changes: initialize all live inputs; preserve them on next; remove the completed input when waiting; or close with no owned input subscriptions.

For input completion delivered after setup and teardown registration, COMPLETE-LAST releases the final input before completing the result. Error still notifies first and then releases result-owned inputs; downstream cancellation is silent. Native ordered-log comparisons, not equivalence to the reused base model, decide this physical ordering claim.

The reusable general merge model and other operators are not silently modified here. Its corresponding physical teardown-order claim, and other specialized-model renderings, should receive separate review. This checkpoint does not certify those models by association.

## Two BDD levels, one navigation index

[Rule BDD](../generated/mergeWith.bdd.md) describes one guarded state/event reaction. [Scenario BDD](../generated/mergeWith.scenarios.md) describes concrete complete or deliberately finite histories. The scenario registry supplies independent inputs and expected outputs; the canonical machine computes predictions, and a separate native runner drives actual RxJS from the inputs.

The [operator inspection index](../operators/mergeWith-index.md) still has exactly eleven entries. Step 4 links both BDD levels; Step 10 adds the upstream coverage matrix; Step 11 links corrective evidence.

## Independent observations

The scenario runner compares expected output values and frames independently against both model and RxJS. It also compares the complete ordered log of input subscribe, input registered teardown, and downstream notifications. Hot pre-subscription emissions are not delivered into the model. Cold frame-zero events are scheduled after setup, not emitted synchronously inside the subscription call. Equal-frame ordering is a property of the fixture scheduler, not an extra mergeWith ordering law.

Never/empty cases check finite observation windows. Native test fixture cleanup after those windows is not mislabeled as an operator event in the compared history.

## Upstream coverage is explicit, not implied

The pinned upstream file contains 22 test bodies. Sixteen have adapted model/native scenario witnesses, four are native-only characterizations, and two invoke mergeAll rather than mergeWith. Adapted witnesses are not a claim to have executed the upstream Mocha suite verbatim.

Native-only characterizations cover synchronous acquisition, plain-array conversion, cancellation through map/mergeWith/map, and cooperative synchronous production stopped by take(3). Those successes do not widen the canonical model's scope. MW-THREE and MW-SINGLE are additional project examples, not upstream cases.

The [coverage projection](../generated/mergeWith.coverage.md) links every upstream title, its disposition and witness. It also derives rule witnesses from predicted traces. Bounded exploration over one through four total inputs checks stored-state invariants and retained-rule reachability. These are finite representative-state checks, not a proof over all payloads, source kinds or scheduler behavior.

## Source basis

All references are pinned to `e5351d02e225e275ac0e497c7b66eaa5f0c88791` (RxJS 7.8.2):

- [mergeWith implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeWith.ts)
- [mergeInternals](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)
- [OperatorSubscriber](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)
- [Official tests](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/mergeWith-spec.ts), inspected blob `1d803de4d18891fecb005dc8d9a65b02ddcd764b`
- [Changelog](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/CHANGELOG.md), including the 7.8.2 mergeWith array regression fix

## Acceptance questions for subsequent refinements

1. Are the retained rules reachable for the declared profile?
2. Does each next-state description expose the actual update?
3. Which upstream test bodies have modeled comparisons, native-only witnesses, exclusions or unresolved gaps?
4. Do native observations check the exact values, timing, subscription ownership and action ordering being claimed?
5. Are generation consistency, finite coverage and runtime conformance reported separately?

A passing generation check establishes document consistency, not semantic correctness. A passing native comparison establishes its observed case, not unrestricted equivalence. This distinction remains visible in the evidence ledger.
