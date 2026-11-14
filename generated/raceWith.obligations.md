# raceWith-fixed-observables-atomic-subscription: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session17-rxjs.test.mjs.

## S17-RACEWITH-SUBSCRIBE

Reach **Unsubscribed** with **first result subscription with valid fixed Observable inputs**, then provide **subscribe**.

Expect, in order: subscribe source input 0 and then every additional input in order.

Resulting state: All source subscriptions live; no winner.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-SUBSCRIBE.

## S17-RACEWITH-FIRST-NEXT

Reach **Racing** with **any live input emits the first value after connection setup**, then provide **input.next**.

Expect, in order: unsubscribe every losing input; forward winner payload.

Resulting state: The winning input alone remains live; its index is permanent.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-FIRST-NEXT.

## S17-RACEWITH-WINNER-NEXT

Reach **Winner** with **value is from selected winner subscription**, then provide **input.next**.

Expect, in order: forward next value unchanged.

Resulting state: Winner and resource identity unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-WINNER-NEXT.

## S17-RACEWITH-EARLY-COMPLETE

Reach **Racing** with **any racing input completes without a prior next**, then provide **input.complete**.

Expect, in order: complete result; release every competing subscription.

Resulting state: Closed successfully without a winner.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-EARLY-COMPLETE.

## S17-RACEWITH-EARLY-ERROR

Reach **Racing** with **any racing input errors before any first next**, then provide **input.error**.

Expect, in order: forward exact error; release every competing subscription.

Resulting state: Closed in error without a winner.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-EARLY-ERROR.

## S17-RACEWITH-WINNER-COMPLETE

Reach **Winner** with **selected winner completes**, then provide **input.complete**.

Expect, in order: complete downstream; release winning source.

Resulting state: Closed successfully, original winner remains recorded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-WINNER-COMPLETE.

## S17-RACEWITH-WINNER-ERROR

Reach **Winner** with **selected winner errors**, then provide **input.error**.

Expect, in order: forward exact error; release winning source.

Resulting state: Closed with original winner recorded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-WINNER-ERROR.

## S17-RACEWITH-CANCEL-RACE

Reach **Racing** with **downstream cancels before a winner**, then provide **cancel**.

Expect, in order: unsubscribe every candidate without notifying downstream.

Resulting state: Closed by cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-CANCEL-RACE.

## S17-RACEWITH-CANCEL-WINNER

Reach **Winner** with **downstream cancels selected source**, then provide **cancel**.

Expect, in order: unsubscribe winner without downstream terminal notification.

Resulting state: Closed by cancellation.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S17-RACEWITH-CANCEL-WINNER.
