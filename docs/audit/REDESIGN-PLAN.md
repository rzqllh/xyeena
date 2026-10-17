# Redesign Plan: Xyeena Rig Public Surfaces

Prinsip: Solusi paling kecil yang benar-benar jalan (Ponytail discipline). Tanpa framework, zero dependencies baru, HTML/CSS/JS native.

---

## 1. Scope & Keputusan Arsitektur

### 1.1 Keputusan Saring (Perlu Ada atau Tidak?)
- Framework UI (React/Vite/Tailwind): **TIDAK PERLU**. Cukup vanilla semantic HTML5 + Modern CSS (custom properties, CSS Grid, clamp) di folder `site/`. Menjamin zero bundle overhead dan zero runtime dependencies di root `package.json`.
- Dynamic Host Routing (Vercel / Cloudflare Worker): **PERLU**. Kode `site/` dibuat self-contained (HTML, CSS, JS statis) dengan konfigurasi minimal untuk Vercel / Cloudflare (`site/vercel.json` atau worker static asset config jika dibutuhkan), terisolasi total dari npm tarball.
- Dependency npm baru: **TIDAK ADA**. Whitelist `package.json` `"files"` tetap tidak memuat `site/`.

### 1.2 Audiens & Tone
- Target Audiens: Hybrid — Solo developer sebagai pengguna utama (bottom-up adoption), dengan fitur Harness/CI sebagai jembatan untuk standarisasi tim.
- Tone: Serius, teknis, hemat kata, tanpa hype marketing, zero em-dash (`—`), kalimat pendek dan aktif, fakta berbasis repo.
- Dual CTA Utama:
  1. Primary: Tombol copy command `npx xyeena-agent@0.2.0 init` dengan indikator status jelas: `v0.2.0 live · v0.2.1 Rig pending`.
  2. Secondary: Tombol tautan langsung ke Dokumentasi & Arsitektur GitHub.

---

## 2. Struktur Section Landing Page (`site/`)

Satu halaman tunggal terkurasi dengan 5 section esensial:
1. **Hero**:
   - Apa ini: Developer toolkit untuk coding agent (Agent Skills modular + project Harness opt-in).
   - Buat siapa: Solo developer & tim engineering yang memakai Antigravity, Claude Code, atau Codex.
   - Dual CTA: Copy command install terverifikasi (`npx xyeena-agent@0.2.0 init`) + Link Docs.
2. **Skills vs Harness**:
   - Komponen 1 (Skills): 19 capabilities portable untuk planning, implementation, review, debugging, security.
   - Komponen 2 (Harness): 41 dokumen guardrail dalam 11 grup, profiling proyek, dan verifikasi native.
   - "All" = hanya melalui seleksi eksplisit, tidak ada silent select-all.
3. **Installer Safeguards**:
   - No silent install (seleksi eksplisit per komponen, runtime, dan skill).
   - Preview dependencies sebelum menulis ke disk.
   - No overwrite file yang dimodifikasi tanpa `--force`.
   - Cancel = zero disk writes.
   - Tidak pernah menyentuh root `AGENTS.md` atau Git hooks tanpa izin eksplisit.
4. **Supported Runtimes**:
   - Matriks dukungan konkret: Antigravity (`.agents/skills/`), Claude Code (`.claude/skills/`), Codex (`.agents/skills/`).
5. **Command Reference**:
   - Tabel ringkas perintah utama: `init`, `doctor`, `harness doctor`, `audit`, `scan`, `risk`, `verify`, `run-init`, `check`, `eval`, `list`, `version`.

---

## 3. Rincian Item Implementasi

### Item 1: Landing Page Mandiri (`site/`)
- **File disentuh**:
  - `site/index.html` (Semantic HTML5, skip link, ARIA landmarks, WCAG AA contrast).
  - `site/style.css` (Vanilla CSS, custom properties, light/dark via `prefers-color-scheme`, zero CSS framework, no horizontal scroll pada 360px/768px/1280px, respects `prefers-reduced-motion`).
  - `site/script.js` (Vanilla JS, keyboard navigation, copy-to-clipboard dengan fallback feedback visual/ARIA).
- **Acceptance Criteria**:
  - Halaman memuat < 100ms tanpa external stylesheet library.
  - Command install `npx xyeena-agent@0.2.0 init` dapat di-copy 1-klik dengan feedback aksesibel.
  - Kontras teks memenuhi WCAG AA (minimum 4.5:1 untuk normal text, 3:1 untuk large text/UI boundaries).
  - Lolos tes responsif 360px, 768px, 1280px tanpa overflow horizontal.
  - `npm pack --dry-run` membuktikan `site/` TIDAK ikut ke dalam tarball npm.
- **Rollback**: Hapus direktori `site/`.

### Item 2: Sinkronisasi README.md
- **File disentuh**:
  - `README.md`
- **Acceptance Criteria**:
  - Pertanyaan "Apa ini, buat siapa, cara install" terjawab dalam 10 detik pertama (hero + command install di paling atas).
  - Command install diubah ke `npx xyeena-agent@0.2.0 init` dengan catatan `0.2.1 Rig pending publish`.
  - Semua karakter em dash (`—`) dihapus dan diganti dengan colon `:` atau tanda baca natural.
  - Klaim "41 docs across 11 groups" dan "19 skills" tetap presisi dan terverifikasi.
- **Rollback**: `git checkout -- README.md`.

### Item 3: Sinkronisasi Public Docs
- **File disentuh**:
  - `docs/GETTING-STARTED.md`
  - `docs/CLI-REFERENCE.md`
- **Acceptance Criteria**:
  - Semua contoh npx default memakai tag live `@0.2.0` (atau catatan versi pending untuk 0.2.1).
  - Semua karakter em dash (`—`) diganti dengan colon atau format natural.
  - Tidak ada klaim bahwa versi 0.2.1 sudah live di npm.
- **Rollback**: `git checkout -- docs/GETTING-STARTED.md docs/CLI-REFERENCE.md`.

### Item 4: Perbaikan Subcommand `--help` & CLI Clean Output
- **File disentuh**:
  - `src/cli.mjs`
  - `src/selection.mjs`
- **Acceptance Criteria**:
  - Menjalankan `xyeena init --help`, `xyeena doctor --help`, atau `xyeena harness --help` mencetak bantuan dan keluar dengan exit code 0 tanpa mengeksekusi aksi/error TTY.
  - Prompt interaktif di `src/selection.mjs` bersih dari em dash (`—`).
  - `xyeena check` menggunakan format status terstruktur `[PASS]` / `[FAIL]`.
  - Semua test suite yang ada (`npm test`) tetap hijau 100%.
- **Rollback**: `git checkout -- src/cli.mjs src/selection.mjs`.

---

## 4. Matriks Verifikasi

1. `npm test` -> semua unit tests lulus tanpa regresi.
2. `npm pack --dry-run` -> file di `site/` terbukti 0 byte / tidak masuk ke npm tarball.
3. `git diff --stat main` -> hanya mencakup `site/`, `docs/audit/`, `README.md`, `docs/GETTING-STARTED.md`, `docs/CLI-REFERENCE.md`, `src/cli.mjs`, `src/selection.mjs`.
4. Browser / Manual inspection -> Verifikasi layout 360px, 768px, 1280px, interaktivitas keyboard, dan kontras warna dark/light.
