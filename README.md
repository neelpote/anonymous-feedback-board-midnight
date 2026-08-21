# Whistleblower Feedback Board

![Frontend CI](https://github.com/neelpote/anonymous-feedback-board-midnight/actions/workflows/frontend-ci.yml/badge.svg?branch=main) ![Contract CI](https://github.com/neelpote/anonymous-feedback-board-midnight/actions/workflows/contract-ci.yml/badge.svg?branch=main)

An anonymous signal room for collecting useful feedback while minimizing identity linkage.

## Evidence, without the identity trail

The [proposal](./PROPOSAL.md) states the reporting model. The [feedback suite](./src/test/feedback.test.ts) covers authorization, one-time submission, and rejection behavior. [TESTING.md](./TESTING.md) makes the checks reproducible; [deployment.json](./deployment.json) anchors them to Preview.

## The signal-room model

The application gives an operator a controlled intake board rather than a public comment feed. A participant can register privately, submit feedback once, and see aggregate activity. The dashboard surfaces the submission pulse, anonymity boundary, wallet connection, contract status, and confirmed transaction state.

## Data and circuits

The `feedback` contract maintains a survey identifier, participant allowlist, nullifiers, response map, response counter, and administrator key.

Key circuits:

- `registerParticipant(participant_pk)`
- `submitFeedback(feedback_text)`
- `computeNullifier(sk, id)`
- `publicKey(sk)`

The application should be treated as a privacy-preserving demonstration: operational metadata and aggregate activity can be visible, while submitter linkage is not used as a public UI field.

## Live contract

```text
Network: Midnight Preview
Contract: feedback
Address: 04401376cd7990f0c475277eea164c5fbd413dac6a2fd335cf20d7fe4f6aca05
Deployment transaction: 00a666de6562e8c82d2ddaca2826e6550806eb99b9b1b58cfebfa5b3b9cf967e1c
Deployment account: mn_addr_preview1hrmn47akzun0cl2p996e2zuc2am9782kjw6vwnf8dgjzx5sytpsqgve64n
Confirmation time: 2026-08-03T18:58:27.555Z
Verification: Confirmed by the Midnight Preview indexer
```

## Run and test

Reporter-flow test funds are available from the [Midnight Preview faucet](https://faucet.preview.midnight.network/).

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
```

To deploy the contract with an explicitly configured test wallet:

```bash
npm run deploy
```

Use fictional feedback and never log a recovery phrase or real whistleblower material.

## Delivery controls

Frontend CI checks the browser build. Contract CI installs Compact, recompiles the generated contract, runs Vitest, and uploads contract output. Release automation is tag-based; dependency audit is scheduled and isolated from secrets.

Demo: [watch the anonymous feedback walkthrough](https://drive.google.com/file/d/1GYvdeIK6ooAInjiN_tNwDEs7yEZoJm_X/view?usp=sharing).

## Verification

Privacy is the product feature: the participant identity and message linkage remain private, while campaign rules and aggregate activity stay auditable. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.
