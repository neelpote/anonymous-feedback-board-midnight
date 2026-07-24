# Whistleblower Feedback Board

An anonymous signal room for collecting useful feedback while minimizing identity linkage.

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
Network: Midnight Preprod
Contract: feedback
Address: 8ef846d84ce3e4eed7257f0d9af4e43bec832fbc07b1a9fec87857f475a8cc85
Deployment transaction: e1c1fca76ff43a9c713448bb635b33b2a7b845349b4dab8dfc404dfe6ce14667
Verification: Confirmed by the Midnight Preprod indexer
```

## Run and test

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

