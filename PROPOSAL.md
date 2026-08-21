# Product Proposal: Whistleblower Feedback Board

**Category:** Consumer focus  
**Signal-room owner:** `neelpote`  
**Current milestone:** End-to-end reviewable MVP

## Problem

Organizations need useful feedback without forcing a reporter to create a permanent identity trail.

## Proposed product

Whistleblower Feedback Board accepts one private feedback submission from an allowlisted participant and exposes only controlled aggregate activity.

## Privacy model

Survey identity, response count, and operational state may be public. Submitter linkage and private wallet context are protected by registration and nullifier checks.

## User journey

1. Administrator registers a participant key.
2. Participant submits feedback through the wallet.
3. Contract records the response and prevents reuse.
4. Dashboard shows activity without a public author profile.

## Success criteria

- Only allowlisted participants can submit.
- A valid submission increments the response count.
- Duplicate submissions fail.
- Test data remains synthetic.
