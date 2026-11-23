# Ai Evals  -  v4 adaptive template

<!-- V4-TEMPLATE id=ai-evals; version=4.0.2 -->

## Task/eval definition

**Questions/required fields:** Expected behavior, dataset origin/rights, labeling rubric, baseline, slices and failure cost.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Metrics and thresholds

**Questions/required fields:** Accuracy/faithfulness, relevance, latency/cost, error severity, abstention, false-positive/negative, human review.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Execution and reproducibility

**Questions/required fields:** Model/provider/version, prompt revision, sampling settings, seed if applicable, date, inputs and logs redacted.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Adversarial and drift cases

**Questions/required fields:** Prompt injection, retrieval contamination, privacy leakage, malformed tools, changing knowledge and distribution shift.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Results and limitations

**Questions/required fields:** Observed scores with denominator and uncertainty, discrepancies and release gate; no fabricated model quality.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Evaluation manifest

| Dataset/split | Rights and provenance | Slice/size | Metric / denominator | Baseline | Acceptance threshold | Actual score/log |
|---|---|---|---|---|---|---|
| `[[FILL: dataset]]` | `[[FILL: permission]]` | `[[FILL: data]]` | `[[FILL: measurable metric]]` | `[[FILL: measured baseline]]` | `[[FILL: approved gate]]` | `[[FILL: NOT RUN until executed]]` |

Use both adversarial/injection cases and ordinary task samples. For generative outputs, require attributable gold standard or human rubric and measured disagreement. Never use fabricated model scores or self-grading alone to claim quality.
