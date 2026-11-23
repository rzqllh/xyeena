# Minimal example  -  onboarding without a knowledge dump

**Illustration only, not real user requirements.** This example is intentionally short; the agent should *not* ask every question in the catalog.

User: “Gua mau bikin sesuatu tapi belum tahu apa.”

Agent: “Mau bikin yang berguna buat kerja, belajar, atau hiburan? Kalau bebas, gua bisa kasih 3 ide kecil.”

User: “Buat kerja, yang gampang.”

Agent: “Pilihan realistis: (1) daftar tugas meeting dengan tindak lanjut; (2) pengingat jadwal; (3) rekap spreadsheet otomatis. Lu tertarik yang mana?”

User: “(1).”

Agent: “Target awalnya catat meeting, siapa mengerjakan apa, dan kapan jatuh temponya. Cuma lu sendiri yang pakai, atau satu tim?”

User: “Satu tim.”

Agent: “Berarti hak akses dan siapa boleh mengubah tugas penting. Gua akan susun rancangan minimal dulu dan tunjukkan pilihan yang perlu lu setujui. Belum coding.”

On later rounds: confirm data visibility, scope, acceptance, platform, chosen stack *after* real constraints. Activate PRD, design, schema, security and test-plan only when pertinent. No skills install, no first-step questionnaire.

## Example of an honest readiness gate

- Goal: meeting action tracker for one team  -  **Confirmed** by user in this illustration.
- Roles/admin/visibility: **Unknown**, blocks account/permission design.
- Hosting stack: **Proposed** only after platform/repository evidence.
- Deployment: **Not approved**. Cannot implement risky features.
- Tests: **NOT RUN**. Do not call this a passing test suite.
