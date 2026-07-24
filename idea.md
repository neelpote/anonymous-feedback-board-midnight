# Project Idea: Anonymous Feedback / Survey (Whistleblower Board)

A secure whistleblowing portal that allows employees of a company to submit verifiable feedback or reports anonymously. It proves that the reporter is a registered employee without linking their employee ID or personal wallet to the post.

## 1. Midnight Network Specialty (ZK & Privacy Features)
*   **Decoupled Authentication:** The ZK circuit verifies that the poster is a registered member of the company allowlist (via a Merkle membership proof) without disclosing which member submitted it.
*   **Topic Nullifiers:** Implements nullifier hashes to ensure each employee can only submit one feedback item per survey/topic, preventing spam while preserving anonymity.
*   **Gas Relayer Independence:** Runs proofs locally in the browser so that an off-chain relayer can submit the transaction and cover DUST fees, eliminating wallet address linkage via transaction fees.

## 2. Technical Architecture (Compact Contract)
*   **Public State:**
    *   `feedback_posts`: List of submitted text feedback reports.
    *   `employee_root`: Merkle root hash of registered employee public keys.
    *   `nullifiers`: List of used nullifier hashes for the current survey topic.
*   **Private State (Employee Wallet):**
    *   `employee_private_key`: Private key associated with the employee.
    *   `merkle_proof`: Merkle membership path to `employee_root`.
*   **Circuits (ZK Proofs):**
    *   `submit_feedback(feedback_text, merkle_proof, employee_private_key, survey_id)`:
        1. Checks that the public key derived from `employee_private_key` belongs to the `employee_root` using the `merkle_proof`.
        2. Computes the `nullifier = hash(employee_private_key, survey_id)`.
        3. Asserts that the `nullifier` does not exist in the public `nullifiers` list.
        *Output:* Adds the feedback post and the nullifier hash to the public state.

## 3. Frontend & Integration (Level 3 Focus)
*   **User Interface:** A forum-style interface where users view anonymous feedback. Employees log in with their credentials, type a response, compile the proof locally, and send it to a relayer.
*   **Lace/Midnight Wallet Integration:**
    *   Retrieves keys for Merkle proof generation.
    *   Delegates fee payments to an off-chain gas relayer.

## 4. Verification & Testing Plan
*   **Unit Tests:**
    *   Assert that a registered employee can submit feedback successfully.
    *   Assert that double submissions for the same survey are blocked via the nullifier check.
    *   Verify that external observers cannot extract the poster's key or identify from the transaction payload.

---

## 5. How to Build & Deploy on Midnight
To build this project without errors, refer to the master build guide located at the root of the workspace: [BUILD_GUIDE.md](file:///Users/neelsubhashpote/moonlight/BUILD_GUIDE.md). It details how to:
1. Fix language pragma version mismatches.
2. Resolve SDK `4.x` dependency issues.
3. Start the Docker-based local ZK proof server.
4. Deploy the contract using a custom `deploy.mjs` script.
5. Prevent DUST gas errors.
