# Cleanup Candidates Audit (Pass 2 Phase 4B)

Zona terlindungi: skills/, harness/ (semua), agents/, rules/, schemas/, evals/ (termasuk fixture), .agents/, .claude-plugin/, .codex-plugin/, plugin.json, .github/, LICENSE, NOTICE.md, CHANGELOG.md, docs/audit/.
Format: path atau symbol | cara deteksi | bukti (command + hasil) | ikut tarball? | verdict DELETE/KEEP/ASK

## 1. Unused Exports dan Dead Symbols di `src/*.mjs`
- `src/paths.mjs:3: SRC_DIR` | knip + ast walk | `git grep "SRC_DIR"`: hanya dipakai di paths.mjs baris 3,4 untuk definisikan PACKAGE_ROOT; nol impor eksternal | ya | DELETE (unexport atau hitung langsung di PACKAGE_ROOT)
- `src/registry.mjs:6: validateCapability` | knip + ast walk | `git grep "validateCapability"`: hanya dipanggil internal di `loadRegistry` baris 25; nol pemanggil eksternal | ya | KEEP (hapus keyword export, jadikan fungsi internal modul)
- `src/selection.mjs:35: skillDescription` | knip + ast walk | `git grep "skillDescription"`: dipanggil internal di readline wizard baris 111; nol impor eksternal | ya | KEEP (hapus keyword export, jadikan fungsi internal modul)
- `src/selection.mjs:43: guardrailDescription` | knip + ast walk | `git grep "guardrailDescription"`: dipanggil internal di readline wizard baris 119; nol impor eksternal | ya | KEEP (hapus keyword export, jadikan fungsi internal modul)
- `src/util.mjs:18: within` | knip + ast walk | `git grep "within"`: fungsi path traversal helper tidak pernah diimpor atau dipanggil di mana pun | ya | DELETE

## 2. File Orphan Non-Terlindungi
- `scripts/consumer-smoke.mjs` | scan scripts/ | `package.json`: dipakai di script `test:consumer` | tidak | KEEP
- `scripts/run-vendored-tests.mjs` | scan scripts/ | `package.json`: dipakai di script `test:harness` | tidak | KEEP
- `scripts/configure-repo.mjs` | scan scripts/ | `package.json`: dipakai di script `configure:repo` | tidak | KEEP
- `scripts/manual-acceptance.mjs` | scan scripts/ | `docs/RELEASE-ACCEPTANCE.md:16`: panduan pengujian rilis manual Windows | tidak | KEEP
- `docs/CAPABILITY-CONTRACT.md` | link scan docs/ | `node link-scan`: spesifikasi teknis kontrak kapabilitas; belum ditautkan dari README | ya | KEEP (rekomendasi: tautkan di docs/ARCHITECTURE.md)
- `docs/ORCHESTRATION.md` | link scan docs/ | `node link-scan`: arsitektur pesan protokol Governor-Executor; belum ditautkan dari README | ya | KEEP (rekomendasi: tautkan di docs/ARCHITECTURE.md)
- `docs/RUNTIME-ADAPTERS.md` | link scan docs/ | `node link-scan`: rincian teknis adapter runtime Antigravity, Claude Code, Codex; belum ditautkan dari README | ya | KEEP (rekomendasi: tautkan di docs/ARCHITECTURE.md)
- `docs/XYEENA_TO_ISLAND_HANDOFF.md` | git status + pack dry-run | file untracked lokal (bocor 4.4kB ke tarball npm jika tidak di-exclude) | ya | ASK (user constraint: jangan hapus/pindah; usulan: exclude via package.json files jika kelak dicommit)
- `src/install.mjs:103-108: hasLegacySkills` | grep legacy | preserve logic untuk upgrade dari 0.1.0; dikunci oleh tests | ya | KEEP

## 3. Junk di Git dan .gitignore
- `git ls-files (*.tgz, *.log, tmp, .DS_Store, Thumbs.db, nul, .bak)` | git ls-files query | `git ls-files | Select-String ...`: 0 hasil (bersih dari artefak sampah) | tidak | KEEP
- `.gitignore: site/.vercel/` | gitignore audit | penambahan entri `.gitignore` untuk mencegah bocor folder build deployment Vercel | tidak | KEEP (sudah ditambahkan)

## 4. Dead CLI Surface (cli.mjs vs Docs vs Help Banner)
- `src/cli.mjs:52 (changed, adapters)` | diff cli.mjs vs help banner | `git grep`: subcmd didukung runtime dan docs/CLI-REFERENCE.md tapi absen di teks banner `xyeena --help` | ya | ASK (tambahkan ke banner help di cli.mjs baris 14)
- `src/cli.mjs:54 (--evidence flag)` | diff cli.mjs vs help banner | `git grep`: flag didukung runtime dan docs/CLI-REFERENCE.md tapi absen di teks banner `xyeena --help` | ya | ASK (tambahkan ke banner help di cli.mjs baris 14-16)
- `src/cli.mjs:31 (--component flag)` | diff cli.mjs vs docs | `git grep`: alias singular untuk `--components`; jalan di runtime tapi tidak tercantum di docs | ya | KEEP (alias toleransi typo pengguna)

## 5. Isi Tarball (bukan aset konsumen publik)
- `docs/XYEENA_TO_ISLAND_HANDOFF.md` | pack-before.txt | `npm pack --dry-run` memuat 4.4kB catatan handoff internal | ya | ASK (tambahkan `!docs/XYEENA_TO_ISLAND_HANDOFF.md` ke package.json files)
- `docs/HARNESS-V3.1-IMPORT-PLAN.md` | pack-before.txt | `npm pack --dry-run` memuat 3.9kB dokumen migrasi internal | ya | ASK (tambahkan `!docs/HARNESS-V3.1-IMPORT-PLAN.md` ke package.json files)
- `docs/RELEASE-ACCEPTANCE.md` | pack-before.txt | `npm pack --dry-run` memuat 5.5kB acceptance testing log internal | ya | ASK (tambahkan `!docs/RELEASE-ACCEPTANCE.md` ke package.json files)
- `harness/upstream-v3.1/` | pack-before.txt | snapshot private harness upstream | ya | KEEP (dibutuhkan subpackage internal)

## 6. Branch dan CI
- `remotes/origin/brand/xyeena-rig` | git branch -a | branch PR #4 historis | tidak | KEEP (laporkan saja, dilarang hapus)
- `remotes/origin/docs/rig-public-guides` | git branch -a | branch PR panduan | tidak | KEEP (laporkan saja, dilarang hapus)
- `remotes/origin/feat/antigravity-guided-*` | git branch -a | branch fitur WIP | tidak | KEEP (zona terlindungi: dilarang sentuh)
- `remotes/origin/release/xyeena-rig-0.2.1` | git branch -a | branch staging rilis | tidak | KEEP (zona terlindungi: dilarang sentuh)
- `.github/workflows/ci.yml, publish.yml` | scan .github/ | CI multi-OS (Ubuntu, Windows, macOS) Node 22/24 + skills-ref | tidak | KEEP

## 7. Status Eksekusi (Phase 4C)
- `src/util.mjs:18: within`: DIHAPUS (commit 9ac44f4).
- `src/paths.mjs:3: SRC_DIR`: UNEXPORTED menjadi private module helper (commit c4d453c).
- `src/registry.mjs:6: validateCapability`: UNEXPORTED menjadi private module helper (commit c4d453c).
- `src/selection.mjs:35: skillDescription`: UNEXPORTED menjadi private module helper (commit c4d453c).
- `src/selection.mjs:43: guardrailDescription`: UNEXPORTED menjadi private module helper (commit c4d453c).
- Banner help CLI: subcmd `changed`, `adapters`, dan flag `--evidence` ditambahkan ke `src/cli.mjs`, dikunci di `test/cli-help.test.mjs`, dan didokumentasikan di `docs/CLI-REFERENCE.md` serta `README.md` (commit 8eba665).
- Tarball exclusions: `!docs/HARNESS-V3.1-IMPORT-PLAN.md`, `!docs/RELEASE-ACCEPTANCE.md`, dan `!docs/XYEENA_TO_ISLAND_HANDOFF.md` ditambahkan ke `package.json` `files` (commit bda84ae).
- `docs/XYEENA_TO_ISLAND_HANDOFF.md`: tetap dibiarkan untracked lokal (tidak dihapus, dipindah, diedit, atau dicommit).
