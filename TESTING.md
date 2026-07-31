# Verification checklist

The executable contract suite is `src/test/feedback.test.ts`.

```bash
npm test
npm run compile
npm run build
```

Five passing scenarios cover campaign initialization, participant whitelisting, an anonymous submission, unregistered-participant rejection, and duplicate-submission protection. The suite verifies that the message can be accepted without linking it to the submitting participant.

CI runs the contract and frontend verification jobs on every push and pull request.
