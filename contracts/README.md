# UpdateSeal Registry (Phase 2 Evidence Evaluation)

`UpdateSealRegistry` is the core intelligent contract for the UpdateSeal decentralized release verification registry on GenLayer. Phase 1 provides a deterministic publisher-scoped registry. Phase 2 adds candidate evidence evaluation under GenLayer validator consensus.

> **Status Notice:**
> - `UpdateSealRegistry` is deployed on GenLayer Studio-dev (`https://studio-dev.genlayer.com/api`, chain ID `61997`) at `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` and evaluates **Evidence Schema v2**.
> - Deployment transaction: `0x8d8179e0ca8875a6cced3564575f98167e5b75245ec5a9c245fe4516016e9897`.
> - The previous address `0x6A882db328782051dFf05C40F4C34b3F223cd80A` is legacy **Evidence Schema v1**. v1 and v2 evidence documents are incompatible. Do not send v2 candidates to the v1 address.
> - Facts live in `deployments/studio-dev.json`. Studio-dev is a preview environment and may reset.
> - `submit_candidate` and `evaluate_candidate` remain separate transactions. `evaluate_candidate` is still not wired into the frontend.
> - No funds are custodied, and no escrow, bonds, or slashing mechanics exist in this contract.

Wallet registration proves which address registered the package. It does not prove ownership of the referenced GitHub repository. Repository ownership verification remains deferred.

Any caller may trigger `evaluate_candidate`. The caller pays for the transaction and is not a validator. The caller does not control the verdict.

---

## Identity Model

| Field | Role |
| :--- | :--- |
| `package_slug` | Human-readable project/package name (3–80 characters) |
| `package_uid` | Canonical publisher-scoped identifier and mapping key |

The contract, not the caller, derives `package_uid`:

```
lowercase(publisher address) + "/" + package_slug
```

Example: `0x1234...abcd/atlas-research-agent`

Different publishers may register the same slug. The same publisher cannot register the same slug twice.

Candidate IDs are derived as:

```
package_uid + "@" + version
```

---

## Stored Data Model

### Package Record (`PackageRecord`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `package_uid` | `str` | Contract-derived publisher-scoped identifier |
| `package_slug` | `str` | Human-readable package name |
| `publisher` | `Address` | Wallet that registered the package |
| `repository_url` | `str` | Public GitHub repository URL. Does not prove repository ownership. |
| `baseline_commit_sha` | `str` | Baseline audited commit SHA (40 or 64 hex characters) |
| `charter_json` | `str` | Canonical frozen v1 charter (max 12,000 characters) |
| `charter_hash` | `str` | SHA-256 hex digest of the canonical charter, computed on-chain |
| `sequence` | `u32` | Zero-indexed sequential ID of the package |

### Candidate Record (`CandidateRecord`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `candidate_id` | `str` | `{package_uid}@{version}` |
| `package_uid` | `str` | Associated package UID |
| `version` | `str` | Release version (1–40 characters) |
| `candidate_commit_sha` | `str` | Target candidate commit SHA (40 or 64 hex characters) |
| `evidence_uri` | `str` | Commit-pinned raw GitHub evidence URL |
| `evidence_hash` | `str` | SHA-256 digest of the evidence body (exactly 64 lowercase hex characters) |
| `submitter` | `Address` | Publisher submitting the candidate |
| `status` | `str` | UI-facing status; starts as `PENDING` |
| `decision_code` | `u32` | UI-facing numeric verdict; starts as `0` |
| `decision_summary` | `str` | UI-facing summary; starts as `""` |
| `evaluation_attempts` | `u32` | Starts at `0`; incremented after each accepted evaluation |
| `finding_codes_json` | `str` | Canonical compact JSON array of unique sorted finding codes |
| `decision_hash` | `str` | SHA-256 of the canonical post-consensus decision payload |

The contract does not store the raw evidence body, validator signatures, transaction hashes, gas usage, or generated consensus metadata.

---

## Repository and Evidence URL Rules

Repository URL must be a public GitHub repository:

```
https://github.com/{owner}/{repository}
```

An optional trailing `.git` or a single trailing slash is accepted and normalized for owner/repository comparison. Query strings, fragments, credentials, custom ports, and extra path components are rejected.

The parsed repository URL must be canonical: `https://github.com/{owner}/{repository}` with that optional `.git` suffix or single trailing slash.

Evidence documents are accepted only from a commit-pinned raw GitHub URL:

```
https://raw.githubusercontent.com/{owner}/{repository}/{candidate_commit_sha}/{path}
```

The parsed evidence URL must be canonical in that form. `{path}` is a non-empty file path whose segments are each non-empty.

Requirements:

- HTTPS only
- Host must be exactly `raw.githubusercontent.com`
- No username, password, fragment, query string, or custom port
- Owner and repository must match the registered GitHub repository
- The commit segment must exactly match `candidate_commit_sha`
- Remaining file path must be non-empty
- Path segments must not be empty (no doubled slashes)
- Path segments must not be `.` or `..`
- Backslashes are rejected
- A percent sign anywhere in the hostname or path is rejected, including percent-encoded dots, slashes, or backslashes
- Localhost, IP addresses, shortened URLs, arbitrary hosts, and caller-controlled redirects are rejected at submission

Unsafe URLs are rejected. They are not resolved.

Redirect handling depends on the GenLayer web client. This contract does not expose redirect control or inspect a final URL after redirects.

---

## Evidence JSON v2 Schema

The fetched document must be an object containing exactly:

```json
{
  "schema_version": 2,
  "package_uid": "...",
  "version": "...",
  "baseline_commit_sha": "...",
  "diff_summary": "...",
  "changed_files": ["..."],
  "declared_capabilities": ["..."],
  "requested_domains": ["..."],
  "evidence_items": ["..."],
  "tests": [
    {
      "name": "...",
      "status": "passed"
    }
  ]
}
```

`candidate_commit_sha` is intentionally absent from the evidence document. A Git commit hash is a digest of the committed tree. Putting that SHA inside the evidence file would change the tree and therefore the SHA, which is a cryptographic fixed-point. Evidence Schema v1 is incompatible.

Candidate-to-evidence binding is:

1. The stored `candidate_commit_sha` on the candidate record
2. The immutable raw GitHub URL commit segment
3. Contract validation that the URL commit equals the submitted candidate commit
4. SHA-256 of the exact fetched evidence bytes (not a reserialized JSON object)

Create evidence in this order:

1. Generate `evidence-v2.json` with the v2 fields only
2. Add it to the candidate code changes
3. Commit the final candidate tree
4. Use the resulting commit SHA as `candidate_commit_sha` and in the raw GitHub URL
5. Hash the exact raw evidence bytes
6. Submit `submit_candidate`

Do not put the commit SHA into the JSON after the commit exists. The bytes must stay unchanged.

Validation:

- No missing or unknown fields
- `schema_version` must be integer `2`, not bool. Integer `1` is rejected
- `package_uid`, `version`, and `baseline_commit_sha` must exactly match the stored package/candidate
- The evidence URL commit segment must equal the stored `candidate_commit_sha`
- `diff_summary`: trimmed, 1–8,000 characters
- `changed_files`: maximum 100 entries
- `declared_capabilities`, `requested_domains`, `evidence_items`: maximum 50 entries each
- `tests`: maximum 100 entries
- Every string entry: trimmed, non-empty, at most 300 characters, no control characters, no duplicates
- Each test object contains exactly `name` and `status`
- Test name: trimmed, non-empty, maximum 200 characters
- Test status must be exactly `passed`, `failed`, or `skipped`

The active Studio-dev contract at `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` requires Evidence Schema v2. The previous address `0x6A882db328782051dFf05C40F4C34b3F223cd80A` is legacy Evidence Schema v1. Do not submit v2 documents against the v1 address.

---

## Decision Codes and Precedence

| Code | Name | Meaning |
| :--- | :--- | :--- |
| 0 | `PENDING` | Submitted, not yet successfully evaluated to a terminal result |
| 1 | `APPROVED` | No hard or review findings |
| 2 | `REVIEW_REQUIRED` | Human review is required |
| 3 | `VIOLATION` | Hard charter or policy violation |
| 4 | `EVIDENCE_UNAVAILABLE` | Fetch, hash, UTF-8, JSON, schema, or identity failure |

Fetch and document failures use these finding codes:

- `HTTP_ERROR`
- `BODY_TOO_LARGE`
- `HASH_MISMATCH`
- `UTF8_INVALID`
- `JSON_INVALID`
- `EVIDENCE_SCHEMA_INVALID`
- `EVIDENCE_IDENTITY_MISMATCH`

Deterministic charter findings:

- `FORBIDDEN_CAPABILITY`
- `UNDECLARED_CAPABILITY`
- `UNAPPROVED_DOMAIN`
- `REQUIRED_EVIDENCE_MISSING`
- `TEST_FAILURE`
- `TEST_SKIPPED`

LLM policy findings:

- `POLICY_AMBIGUITY`
- `POLICY_VIOLATION`

Hard violations: `FORBIDDEN_CAPABILITY`, `UNDECLARED_CAPABILITY`, `UNAPPROVED_DOMAIN`, `TEST_FAILURE`, `POLICY_VIOLATION`.

Exact precedence:

1. Evidence fetch/hash/schema/identity failure → `EVIDENCE_UNAVAILABLE`
2. Any hard deterministic finding or `POLICY_VIOLATION` → `VIOLATION`
3. `REQUIRED_EVIDENCE_MISSING`, `TEST_SKIPPED`, or `POLICY_AMBIGUITY` → `REVIEW_REQUIRED`
4. Otherwise → `APPROVED` with finding code `NO_VIOLATION`

Finding codes are stored as a sorted, unique, canonical compact JSON array.

---

## Evaluator Architecture

`evaluate_candidate(candidate_id)`:

1. Loads the candidate and package from storage.
2. Rejects terminal verdicts and a fourth attempt after three evaluations.
3. Snapshots string identities into the nondeterministic block. It does not write storage from leader or validator functions.
4. Fetches evidence with `gl.nondet.web.request(..., method="GET")`.
5. Requires HTTP 200, caps the body at 100,000 bytes, hashes the exact raw bytes with SHA-256, compares the digest to the stored lowercase `evidence_hash`, decodes strict UTF-8, and parses JSON.
6. Validates the evidence v1 schema and stored identities.
7. Derives deterministic charter findings.
8. Calls `gl.nondet.exec_prompt(..., response_format="json")` only for `policy_text` assessment when no hard deterministic finding already exists. Charter, diff, paths, and evidence are delimited as untrusted data.
9. Builds a bounded leader result: `decision_code`, `decision_name`, `finding_codes`, `summary`, `evidence_hash`, `charter_hash`.
10. Runs an independent validator through `gl.vm.run_nondet` (this pinned SDK’s name for `run_nondet_unsafe`).
11. Writes storage only after that call returns.

The validator independently:

1. Refetches the evidence
2. Rechecks status, size, raw-byte hash, UTF-8, JSON schema, and stored identities
3. Rederives deterministic findings
4. Runs its own LLM policy assessment when appropriate
5. Validates the leader result schema
6. Requires exact `decision_code`, `decision_name`, sorted `finding_codes`, `evidence_hash`, and `charter_hash`

The validator does not require identical free-text summaries. It does require the leader summary to be trimmed, non-empty, at most 1,000 characters, and free of control characters. Consensus is not granted merely because the leader returned valid JSON.

Malformed or contradictory LLM output is converted into a bounded `REVIEW_REQUIRED` / `POLICY_AMBIGUITY` result. Unexpected validator exceptions return disagreement.

After consensus, the contract increments `evaluation_attempts`, stores `status`, `decision_code`, `decision_summary`, and canonical `finding_codes_json`, and computes `decision_hash` as SHA-256 of canonical JSON containing `candidate_id`, `decision_code`, `decision_name`, `finding_codes`, `summary`, `evidence_hash`, and `charter_hash`.

---

## Retry Behavior

- `APPROVED`, `REVIEW_REQUIRED`, and `VIOLATION` are terminal and cannot be evaluated again.
- `EVIDENCE_UNAVAILABLE` may be retried through the same `evaluate_candidate` method.
- Maximum three total evaluation attempts.
- After three unavailable attempts, further evaluation is rejected.
- `evaluation_attempts` begins at zero when the candidate is submitted.
- A terminal result is never overwritten.

---

## Limitations

- This phase evaluates the submitted, commit-pinned evidence document.
- It does not yet prove GitHub account ownership.
- It does not yet verify GitHub Actions attestations.
- It does not yet guarantee that the evidence describes every repository change.
- Redirect handling depends on the GenLayer web client capabilities.
- Studio-dev deployments are preview state and may disappear on reset.

---

## Identifier and Charter Rules

Package slugs must be 3–80 characters, lowercase, begin and end with a lowercase letter or digit, contain only lowercase letters, digits, dots, hyphens, and underscores, contain no `/`, `@`, whitespace, or control characters, and equal their trimmed form.

Versions must be 1–40 characters, equal their trimmed form, contain only letters, digits, dots, hyphens, and plus signs, and contain no `@`, `/`, whitespace, or control characters.

Charter JSON must be canonical v1 as in Phase 1. `charter_hash` is computed on-chain from the canonical UTF-8 bytes.

---

## Public Methods

### Write methods

- `register_package(package_slug, repository_url, baseline_commit_sha, charter_json) -> str`
- `submit_candidate(package_uid, version, candidate_commit_sha, evidence_uri, evidence_hash) -> str`
- `evaluate_candidate(candidate_id) -> str`

`evaluate_candidate` may be called by any address. Only the package publisher may submit candidates.

### View methods

- `get_package_uid(publisher_address, package_slug) -> str`
- `package_exists(package_uid: str) -> bool`
- `get_package(package_uid: str) -> PackageRecord`
- `package_count() -> u32`
- `package_uid_at(index: int) -> str`
- `candidate_exists(candidate_id: str) -> bool`
- `get_candidate(candidate_id: str) -> CandidateRecord`
- `candidate_count() -> u32`
- `candidate_id_at(index: int) -> str`
- `get_candidate_id(package_uid: str, version: str) -> str`

---

## Testing and Verification

```bash
genvm-lint check contracts/UpdateSealRegistry.py
pytest contracts/tests/test_registry_direct.py -q
```

Direct-mode tests keep `direct_vm.strict_mocks = True` and `direct_vm.check_pickling = True`. Tests mock every web request and every LLM response. They do not perform real network or LLM calls.
