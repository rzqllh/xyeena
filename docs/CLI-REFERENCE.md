# CLI Reference

See [current source/host status](STATUS.md) (2026-10-26). CLI 1.4.7 `force_ask`/user-cancel and a narrowly scoped auto-`deny` passed native Windows acceptance; IDE 2.5.5 interception remains blocked. Commands implemented after npm 0.4.1 are source-only.

Commands can be invoked with `npx --yes xyeena-agent@0.4.1` for the published package or `node bin/xyeena.mjs` from a source checkout. Features introduced in the P00–P10 rebuild are marked **source rebuild**.

---

## 1. Transactional Installer & Lifecycle (Source Rebuild)

The new transactional installer (DEC-26, DEC-29) provides safe, conditional installation with baseline integrity checks and two-way rollback:

```sh
# Pemasangan aman (default mode copy di Windows, dry-run pratinjau)
node bin/xyeena.mjs install --runtime antigravity --scope workspace --dry-run
node bin/xyeena.mjs install --runtime antigravity --scope workspace --yes

# Pemasangan global dengan mode symlink eksplisit
node bin/xyeena.mjs install --runtime gemini --scope global --mode symlink --yes

# Perbaikan instalasi yang rusak
node bin/xyeena.mjs repair --runtime antigravity --scope workspace --yes

# Safe uninstall (mempertahankan file custom pengguna)
node bin/xyeena.mjs uninstall --runtime antigravity --scope workspace --yes

# Menyetujui modifikasi file pengguna via fingerprint diff (DEC-26)
node bin/xyeena.mjs install --runtime antigravity --scope workspace --diff-approved-fingerprint <FINGERPRINT> --yes
```

| Flag | Deskripsi |
| :--- | :--- |
| `--runtime <HOST>` | Target host: `antigravity`, `gemini`, `codex`, `claude`, `hermes`, atau `all-supported` |
| `--scope <SCOPE>` | `workspace` (lokal project) atau `global` (user directory) |
| `--mode <MODE>` | `copy` (default Windows) atau `symlink` (directory junction/link) |
| `--dry-run` | Menampilkan rencana tindakan dan diff tanpa menulis file |
| `--yes` | Menyetujui eksekusi rencana transaksi |
| `--diff-approved-fingerprint` | Fingerprint bukti peninjauan diff untuk menimpa file yang telah dimodifikasi user |
| `--force` | Mengizinkan downgrade versi; **tidak dapat melewati** perlindungan modifikasi pengguna tanpa fingerprint |

---

## 2. Cortex Native Intelligence (Source Rebuild)

Perintah inspeksi dan diagnosis engine Cortex (DEC-27):

```sh
# Periksa kesehatan engine Cortex, token budget, dan invarian arsitektur
node bin/xyeena.mjs cortex status

# Evaluasi intent, tiering, capability selection, dan supporting budget dari prompt
node bin/xyeena.mjs cortex inspect --prompt "Review a failing authentication test"
```

| Subperintah | Efek |
| :--- | :--- |
| `cortex status` | Melaporkan status registri (64 capability contracts), memory store, budget constraints, dan policy rules |
| `cortex inspect --prompt TEXT` | Menampilkan hasil perutean intent, klasifikasi tier (`TIER_0_MICRO`, `TIER_1_STANDARD`, `TIER_2_DEEP`), dan batasan supporting skills |

---

## 3. Setup Wizard & Maintenance (Legacy & Compact)

```sh
# Wizard interaktif
node bin/xyeena.mjs setup

# Pratinjau non-interaktif
node bin/xyeena.mjs setup --scope workspace --runtime codex --preset balanced --dry-run

# Mode compact (hanya mengekspos xyeena-rig/SKILL.md ke host)
node bin/xyeena.mjs setup compact --runtime codex --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime codex --preset complete --yes

# Pemeriksaan kesehatan instalasi di host
node bin/xyeena.mjs setup check --runtime antigravity

# Manajemen backup dan rollback
node bin/xyeena.mjs setup backups
node bin/xyeena.mjs setup rollback --id <BACKUP_ID> --dry-run
node bin/xyeena.mjs setup rollback --id <BACKUP_ID> --yes
```

---

## 4. Discovery, Routing, dan Orchestration

```sh
# Menampilkan matriks skill lintas host di filesystem
node bin/xyeena.mjs skills matrix

# Menemukan skill yang tersedia untuk host tertentu
node bin/xyeena.mjs skills discover --runtime codex

# Memilih kandidat skill berdasarkan prompt tanpa memanggil model
node bin/xyeena.mjs route --runtime codex --prompt "Debug race condition in task runner"

# Pratinjau rencana alur kerja orchestration
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Run unit tests and fix regressions"

# Menjalankan sesi one-shot agent terisolasi dengan persetujuan eksplisit
node bin/xyeena.mjs orchestrate run --runtime codex --goal "Refactor router module" --yes
```

---

## 5. Harness, Audit, dan Verifikasi

```sh
# Daftar capability yang terpasang
node bin/xyeena.mjs list

# Diagnosis kesehatan instalasi
node bin/xyeena.mjs doctor

# Audit status kepatuhan guardrail repository (read-only)
node bin/xyeena.mjs audit

# Pemeriksaan invarian proyek (exit code non-nol bila ada blocker)
node bin/xyeena.mjs scan

# Penilaian cakupan risiko perubahan git
node bin/xyeena.mjs risk
node bin/xyeena.mjs changed

# Menjalankan pemeriksaan native proyek yang sebenarnya
node bin/xyeena.mjs verify

# Validasi integritas source dan kontrak kapabilitas
node bin/xyeena.mjs check --source .

# Menjalankan evaluator skenario deterministik
node bin/xyeena.mjs eval
```

---

## 6. Antigravity Guided Hooks

```sh
# Pratinjau, instalasi, dan status lifecycle hooks
node bin/xyeena.mjs guided preview --dir .
node bin/xyeena.mjs guided install --dir . --yes
node bin/xyeena.mjs guided status --dir .
node bin/xyeena.mjs guided uninstall --dir . --yes

# Diagnostic probe untuk menguji callback host (harmless git status test)
node bin/xyeena.mjs guided probe start --dir . --yes
node bin/xyeena.mjs guided probe status --dir .
node bin/xyeena.mjs guided probe clear --dir . --yes

# Single-use native deny probe (menguji apakah host benar-benar memblokir tool)
node bin/xyeena.mjs guided probe deny-start --dir . --yes
```

---

## 7. Prasyarat Operasional (Ops Preflight)

```sh
node bin/xyeena.mjs ops preflight --dir .
```

Memeriksa PATH eksekusi lokal dan metadata `.agents/hooks.json` tanpa memanggil host command atau model AI. Menghasilkan laporan jujur `hostEnforcement: UNVERIFIED` jika aktivasi daemon host belum dibuktikan secara empiris.
