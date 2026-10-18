# Redesign Plan: Xyeena Rig Public Surfaces (Pass 2 - Non-Landing)

Prinsip: Ponytail discipline. Hanya solusi esensial, minim intervensi, tanpa dependency baru, zero em dash, fakta berbasis repo.

---

## 1. Scope dan Keputusan Saring (Perlu Ada atau Tidak?)

### 1.1 Item yang PERLU Dikerjakan
1. **Runtime CLI Non-TTY Error Diagnostic (`src/selection.mjs:91`)**:
   - Status: PERLU.
   - Justifikasi: `xyeena init` di lingkungan non-TTY (CI/script) melempar error petunjuk: `--runtime` dan `--skills`. Pesan ini membingungkan pengguna yang ingin menginstal komponen Harness via CI (membutuhkan `--guards`).
   - Solusi: Perbarui teks error agar menyertakan `--guards`.

2. **Sanitasi Punctuation dan Em Dash Dokumen Publik**:
   - Status: PERLU.
   - Justifikasi: Konsistensi aturan brand (zero em dash) di seluruh dokumen repositori.
   - File target:
     - `CHANGELOG.md` (header 0.2.1 dan 0.2.0, plus section Unreleased).
     - `NOTICE.md` (pemisah pengaruh riset).
     - `docs/BRANDING.md` (tabel identitas Xyn).
     - `docs/ARCHITECTURE.md` (daftar modul kernel).
     - `docs/EVALS.md` (daftar tipe evaluasi).
     - `docs/RELEASE-ACCEPTANCE.md` (judul dokumen).

3. **Metadata Plugin Marketplace (`.agents/plugins/marketplace.json`)**:
   - Status: PERLU.
   - Justifikasi: File metadata saat ini minim deskripsi. Tambahkan deskripsi ringkas konsisten Rig tanpa mengubah versi atau skema.

4. **Entri Unreleased di CHANGELOG.md**:
   - Status: PERLU (Wajib).
   - Justifikasi: Mendokumentasikan perubahan Pass 1 (landing page, help flag, pin 0.2.0, isolasi tarball) dan Pass 2 secara transparan sebelum rilis 0.2.1.

5. **Release-Day Bump Checklist (`docs/audit/RELEASE-DAY-BUMP.md`)**:
   - Status: PERLU (Wajib).
   - Justifikasi: Memastikan transisi dari `@0.2.0` ke `@0.2.1` dilakukan secara mekanis dan presisi tanpa human error saat npm publish.

### 1.2 Item yang TIDAK PERLU / DILARANG Dikerjakan
1. **Frontmatter `skills/*/SKILL.md`**:
   - Status: DILARANG (LOCKED).
   - Justifikasi: Field `name` dan `description` dipakai langsung oleh skill resolver dan test evaluasi (16/16 evals).
2. **Aturan `harness/guides/*.md`**:
   - Status: DILARANG (REPORT ONLY).
   - Justifikasi: Dokumen guardrail disalin ke repositori consumer dan dilindungi integritas instalasi.
3. **Edit package.json Version / Dependencies**:
   - Status: DILARANG.
   - Justifikasi: Hard constraint. Versi 0.2.1 tetap, tidak ada penambahan dependencies.
4. **Modifikasi `harness/upstream-v3.1/`**:
   - Status: DILARANG.
   - Justifikasi: Subpackage upstream snapshot bersifat privat dan terisolasi.

---

## 2. Rincian Item Rencana Implementasi (Phase 4)

### Item 1: Perbaikan Pesan Non-TTY di `src/selection.mjs`
- **File disentuh**: `src/selection.mjs:91`
- **Perlu ada**: Ya. Petunjuk CLI CI harus akurat untuk semua komponen (`skills` dan `harness`).
- **Perubahan**:
  Sebelum:
  `Non-interactive terminal requires flags: specify --runtime and --skills (or --all), plus --yes to confirm.`
  Sesudah:
  `Non-interactive terminal requires flags: specify --components, --runtime, --skills, or --guards (or all), plus --yes to confirm.`
- **Acceptance Criteria**:
  - `npm test` lolos (63/63).
  - Pesan error non-TTY mencantumkan flag `--guards`.
- **Rollback**: `git checkout -- src/selection.mjs`

### Item 2: Sanitasi Em Dash di Dokumentasi
- **File disentuh**:
  - `NOTICE.md`
  - `docs/BRANDING.md`
  - `docs/ARCHITECTURE.md`
  - `docs/EVALS.md`
  - `docs/RELEASE-ACCEPTANCE.md`
- **Perlu ada**: Ya. Konsistensi tone serius, zero hype, zero em dash.
- **Perubahan**: Ganti karakter `—` menjadi `:` atau koma sesuai konteks kalimat.
- **Acceptance Criteria**:
  - `Get-ChildItem -Path NOTICE.md, docs/BRANDING.md, docs/ARCHITECTURE.md, docs/EVALS.md, docs/RELEASE-ACCEPTANCE.md | Select-String "—"` menghasilkan 0 temuan.
  - Makna teknis tidak berubah.
- **Rollback**: `git checkout -- NOTICE.md docs/`

### Item 3: Metadata Plugin Marketplace
- **File disentuh**: `.agents/plugins/marketplace.json`
- **Perlu ada**: Ya. Identitas Rig konsisten di katalog plugin.
- **Perubahan**: Tambahkan description field pada plugin manifest.
- **Acceptance Criteria**:
  - JSON valid (`node -e "JSON.parse(fs.readFileSync('.agents/plugins/marketplace.json'))"`).
- **Rollback**: `git checkout -- .agents/plugins/marketplace.json`

### Item 4: CHANGELOG.md Unreleased Entry
- **File disentuh**: `CHANGELOG.md`
- **Perlu ada**: Ya. Catatan rilis komprehensif untuk Pass 1 dan Pass 2.
- **Perubahan**: Tambahkan header `## [Unreleased]` di atas versi 0.2.1, tanpa tanggal dan tanpa version bump. Perbaiki em dash pada header 0.2.1 dan 0.2.0.
- **Acceptance Criteria**:
  - Memuat ringkasan Pass 1 (landing page, non-TTY help fix, pin install 0.2.0) dan Pass 2.
  - Zero em dash di seluruh file CHANGELOG.md.
- **Rollback**: `git checkout -- CHANGELOG.md`

---

## 3. Usulan Metadata Publik Eksternal (Non-Repo)

Item ini tidak diaplikasikan ke repositori langsung (sesuai hard constraint package.json):

1. **package.json description** (saat rilis berikutnya):
   - Nilai usulan: `"Xyeena Rig: selectable Agent Skills and opt-in project Harness for Antigravity, Claude Code, and Codex."`
2. **GitHub About**:
   - Nilai usulan: `"Developer tooling for coding agents: selectable Agent Skills + opt-in project Harness. Zero runtime dependencies."`
3. **GitHub Topics**:
   - Nilai usulan: `agent-skills`, `coding-agents`, `antigravity`, `claude-code`, `codex`, `developer-tools`, `guardrails`, `code-quality`, `verification`

---

## 4. Gerbang Persetujuan (Gate STOP)

Sesuai instruksi Phase 3, seluruh perubahan kode dan dokumentasi pada Phase 4 di atas HANYA dieksekusi setelah rencana ini disetujui oleh pengguna.
