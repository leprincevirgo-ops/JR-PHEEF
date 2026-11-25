# JR Quantum — Scientific Computing Platform

Status: approved direction; implementation plan. This document does not claim that planned capabilities are deployed.

## Product boundary

JR Quantum is an integrated scientific-computing capability inside the single JR PHEEF product. It is not a separate application, a claim of quantum advantage, or a promise of access to physical quantum hardware.

The existing Quantum Workbench remains the entry point inside WORLDS. Quantum Grid is the compute-routing and provider-governance layer behind that experience. JR Intelligence provides natural-language explanations and research assistance, while mathematical calculations and simulations must be performed by deterministic, testable engines rather than generated prose.

## Current verified baseline from the foundation branch

- `fresh/public/quantum-simulator.js` implements a local ideal two-qubit state-vector simulator with H, X, Z and CNOT gates and a maximum of 20 gates.
- `fresh/public/quantum-grid.js` renders a two-qubit educational workbench in `#view-worlds`.
- `fresh/public/quantum-grid.css` styles the workbench.
- `fresh/test/quantum-grid.test.js` covers Bell-pair probabilities, Hadamard, X, H-Z-H, normalization and invalid input.
- The UI explicitly says no external quantum hardware is connected. No external provider integration or hardware execution is verified.
- The simulator is ideal and does not model noise, decoherence or hardware imperfections. It is a teaching prototype, not a research-grade quantum platform.

## Architecture

1. **Quantum Mathematics Engine**
   - Complex-number arithmetic, vectors, matrices, conjugate transpose, inner products, norms, normalization and tensor products.
   - Matrix multiplication, identity, Pauli, Hadamard and phase operators.
   - Unitarity checks, Hermitian checks and probability normalization checks.
   - Numerically stable tolerances, explicit precision limits and invalid-input handling.
   - Deterministic unit tests with independently calculated reference cases.

2. **Quantum Circuit and Simulation Engine**
   - Preserve the current two-qubit simulator as a documented teaching mode.
   - Add a scalable state-vector simulator only with explicit qubit and memory limits.
   - Add measurement sampling with seeded/reproducible randomness and distinguish exact probabilities from sampled counts.
   - Add gate validation, circuit serialization, versioned experiment inputs and reproducible result metadata.
   - Model noise channels only after ideal-circuit validation; label noisy simulation separately.

3. **Quantum Workbench**
   - Circuit editor, qubit register, gate palette, state-vector and Bloch-sphere views where mathematically valid.
   - Step-by-step execution, measurement, experiment history and accessible explanations.
   - Clearly label local educational simulation, classical computation, provider job submission and hardware results.
   - Keep the interface usable on mobile and avoid implying that an illustrative animation is a scientific result.

4. **Quantum Grid and compute routing**
   - Route ordinary workloads to classical CPU/GPU computation by default.
   - Route supported circuits to local simulation within declared resource limits.
   - Add provider adapters only after a provider is selected, credentials are configured securely, terms/costs are reviewed and connectivity is directly tested.
   - Require explicit approval before any paid external job.
   - Record provider, backend, job identifier, submitted circuit hash, queue/execution status, shots, calibration/noise metadata and result provenance without exposing credentials.

5. **Quantum AI and scientific guidance**
   - Explain concepts at beginner and advanced levels.
   - Translate natural-language questions into proposed equations or circuits, then validate them through deterministic engines.
   - Separate established science, mathematical derivation, simulation, hypothesis and speculation.
   - Never fabricate citations, provider connectivity, experiments, discoveries or quantum advantage.
   - Require source attribution for external scientific claims and preserve reproducible calculation steps.

6. **Scientific disciplines**
   - Quantum mechanics and information; linear algebra, complex analysis, probability and statistics; quantum algorithms and complexity; quantum chemistry and materials; quantum sensing and communication; classical physics, relativity, astronomy, particle physics, thermodynamics, engineering and computational biology.
   - Each discipline receives structured learning paths, references, worked examples and validated computational exercises.

7. **Research and verification**
   - Each result carries a provenance class: mathematically derived, classically computed, locally quantum-simulated, provider-simulated, hardware-executed or independently experimentally validated.
   - Store inputs, engine/version, precision, seeds/shots, assumptions, units, timestamps and output hashes.
   - Include independent cross-checks and reproducibility tests before describing a result as verified.
   - Do not create persistent research tables until data ownership, access policies, retention and backup/restore requirements are reviewed.

## Delivery sequence and acceptance gates

### Phase 0 — Baseline and safety
- Confirm all Quantum Workbench assets load in staging and that the workbench mounts once in WORLDS.
- Run the existing test suite and preserve current JR PHEEF navigation and identity boundaries.
- Fix any confirmed asset, initialization, accessibility or mobile regressions before extending functionality.

### Phase 1 — Mathematical foundation
- Implement a pure, dependency-light quantum mathematics module.
- Add comprehensive Node test coverage for complex arithmetic, vector/matrix operations, tensor products, state normalization and operator properties.
- Require independent known-answer cases and numerical tolerance tests.

### Phase 2 — Simulator correctness and capability
- Refactor the current simulator to use the tested mathematics layer without changing existing expected results.
- Add controlled multi-qubit capability only after memory/time bounds and tests are established.
- Add measurement sampling and optional noise models with explicit labels.

### Phase 3 — Workbench and Quantum Grid
- Add circuit editing, visualization, reproducible experiment runs and result export.
- Keep Quantum Workbench embedded in the existing JR PHEEF WORLDS environment.
- Verify asset loading, mobile layout, keyboard access and browser execution.

### Phase 4 — AI science guidance
- Add specialist quantum/science guidance to JR Intelligence.
- Connect AI explanations to validated math/simulation functions.
- Add citations, uncertainty labels and hallucination-resistant result summaries.

### Phase 5 — External providers
- Evaluate supported providers and their current APIs, regions, costs, terms and data handling.
- Implement provider adapters behind a disabled-by-default feature flag.
- Enable only after secrets are stored server-side, access is restricted, cost caps and approval gates exist, and a real test job is independently verified.

### Phase 6 — Research-grade verification
- Add experiment provenance, benchmark suites, cross-simulator comparisons and independent scientific review.
- Do not claim research-grade status until the relevant discipline-specific validation criteria are met.

## Security, privacy and operations

- Never put provider secrets, service-role keys or private credentials in browser assets, source control or logs.
- Keep user research private by default; apply least-privilege access and row-level security if persistence is later introduced.
- Do not submit external jobs, incur charges, collect sensitive research data or activate provider integrations without explicit user approval.
- Maintain rollback-safe, staged releases and run the complete existing test suite plus quantum-specific tests before deployment.

## Definition of done

A capability is complete only when its source is present, automated tests pass, the staging UI is directly exercised, outputs are scientifically checked, security boundaries are reviewed and deployment is verified. A code file or a successful build alone is not proof of end-to-end functionality.
