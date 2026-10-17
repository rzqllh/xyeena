# Public Surface Audit: Xyeena Rig

Format: [SEVERITY] [LOKASI] — MASALAH -> FIX (1 baris per temuan)

## 1. AI-Slop Copy Patterns
- P1 README.md:21: Em dash "Xyn — The Lion Guardian" melanggar aturan R-02 -> ganti tanda pisah dengan colon atau kurung.
- P1 README.md:29-31: Em dash spam berulang pada daftar tautan dokumentasi -> ganti dengan colon atau deskripsi langsung.
- P1 README.md:5: Rangkaian 4 klaim bertumpuk "clearer scope, safer operations, stronger evidence, and repeatable project checks" -> ringkas menjadi kalimat aktif padat tanpa adjective stacking.
- P1 README.md:145: Frasa deskripsi abstrak berlebih "core judgment/context, Full GRILL, primary-source research..." -> tulis aksi konkret yang dijalankan agent.
- P1 docs/BRANDING.md:9: Em dash "Xyn — The Lion Guardian" di tabel identitas -> ganti dengan format nama standar tanpa em dash.
- P1 docs/ARCHITECTURE.md:9-17: 9 baris berturut-turut memakai em dash sebagai pemisah komponen -> ubah ke format colon ":".
- P1 docs/EVALS.md:5-12: 8 butir evaluasi memakai em dash sebagai penghubung klaim -> ubah ke format colon ":" atau kalimat langsung.
- P1 docs/GETTING-STARTED.md:5,68: Em dash pada deskripsi paket npm dan referensi silang -> ganti dengan tanda baca koma atau titik.
- P2 NOTICE.md:6-15: Em dash berulang pada daftar atribusi ekosistem -> ubah ke colon ":".
- P1 src/selection.mjs:94,104,108,109,114,115: CLI interactive setup memancarkan em dash di setiap prompt teks -> ganti dengan colon ":" atau strip biasa "-".

## 2. Klaim Tak Terverifikasi dari Repo
- P0 README.md:41: Cuplikan install mengarahkan `npx xyeena-agent@0.2.1 init` seolah 0.2.1 live di npm -> ubah ke `npx xyeena-agent@0.2.0 init` atau beri label eksplisit "(0.2.1 pending)".
- P0 docs/GETTING-STARTED.md:19,28,31,34,37,56-59: Seluruh blok command memakai tag `@0.2.1` tanpa disclaimer status publish -> ubah ke `@0.2.0` dan tandai status rilis 0.2.1.
- P0 docs/CLI-REFERENCE.md:6,7,10,51: Command referensi memuat `@0.2.1` sebagai command operasional -> ubah ke `@0.2.0` untuk command live saat ini.
- P1 harness/upstream-v3.1/runtime/xyeena-harness.mjs:50: Help text internal memuat `xyeena install-hook` padahal install-hook diblokir di bridge src/harness.mjs -> hapus opsi install-hook dari help text publik.
- P2 .codex-plugin/plugin.json:30: Field `websiteURL` mengarah ke GitHub repo bukan ke dokumentasi/landing resmi -> arahkan ke URL landing site setelah live.

## 3. Inkonsistensi Versi (0.2.0 vs 0.2.1)
- P0 README.md:25,34,41: README menyatakan 0.2.1 membawa Rig branding tapi cuplikan utama instalasi memaksa `@0.2.1` sebelum rilis npm -> tegaskan bahwa 0.2.0 adalah rilis aktif dan 0.2.1 adalah rilis staging di branch main.
- P1 src/cli.mjs:5, paths.mjs:4: Banner CLI melaporkan `Xyeena Rig 0.2.1` sedangkan user yang menjalankan lewat npx tanpa tag mengambil 0.2.0 -> jelaskan perbedaan versi lokal/repo vs versi npm registry.
- P1 CHANGELOG.md:3: Header "0.2.1 — Xyeena Rig branding and documentation" tidak memiliki status tanggal rilis / unreleased marker -> tandai jelas sebagai `Unreleased` atau `Pending publish`.

## 4. Struktur Informasi (< 10 Detik: Apa Ini, Buat Siapa, Cara Install)
- P0 README.md:1-45: Command instalasi baru muncul di baris 41 setelah tabel komponen dan catatan branding panjang -> pindahkan hero elevator pitch dan command install ke bagian paling atas (< 10 detik terbaca).
- P1 README.md:1-14: Nilai "buat siapa" tidak eksplisit di awal (hanya menyebut runtime Antigravity, Claude, Codex tanpa memperjelas solo dev vs tim) -> nyatakan di baris kedua: untuk solo dev dan tim engineering yang memakai coding agent.
- P1 docs/GETTING-STARTED.md:1-25: Penjelasan prasyarat dan konsep mendahului command install tercepat -> tempatkan quickstart install langsung di bawah heading utama.
- P1 CLI banner (`xyeena --help`): Menampilkan list command tanpa one-line purpose atau quick start -> tambahkan one-line summary dan interactive quickstart command di header help.

## 5. Aksesibilitas CLI Output
- P0 src/cli.mjs:24-25: Argumen `--help` pada sub-perintah (`xyeena init --help`, `xyeena doctor --help`, `xyeena harness --help`) diabaikan dan langsung menjalankan aksi/error -> cegat flag `--help` / `-h` di setiap sub-perintah untuk mencetak bantuan tanpa eksekusi.
- P1 src/selection.mjs:91: `xyeena init` di lingkungan non-TTY langsung melempar raw exception -> cetak pesan instruksi bantuan CI yang ramah dan exit code 1 bersih.
- P1 src/cli.mjs:57: Perintah `xyeena check` hanya mengeluarkan teks `PASS` atau `FAIL` polos tanpa indikator visual yang terstruktur -> gunakan prefix simbol standar yang terbaca screen-reader `[PASS]` / `[FAIL]`.
- P2 src/selection.mjs:97,125: Prompt input interaktif tidak memiliki pemisah visual atau kontras yang jelas -> tambahkan format penanda prompt `>` yang konsisten.

## Pass 2: Audit Surface Tambahan (Non-Landing)
Format: lokasi | masalah | fix | severity

### 1. Plugin Metadata
- plugin.json:4 | versi 0.2.1 belum live di npm | biarkan sinkron package.json tapi tandai status rilis di dokumentasi | P2
- .claude-plugin/plugin.json:4 | versi 0.2.1 belum live di npm | biarkan sinkron package.json | P2
- .codex-plugin/plugin.json:30 | websiteURL mengarah ke root GitHub bukan landing site atau docs spesifik | perbarui ke URL landing resmi setelah domain live | P2
- .agents/plugins/marketplace.json:3 | metadata minimal tanpa deskripsi panjang | tambahkan short description konsisten Rig | P2

### 2. Body Prose Skills (19 skills/*/SKILL.md)
- skills/*/SKILL.md (frontmatter) | name dan description terkait ke resolver serta evals | LOCKED: jangan diubah | P2
- skills/*/SKILL.md (body prose) | nihil em dash, nol buzzwords marketing (seamless, elevate, dll), nol kebocoran Notch/Xyn | pertahankan | P2

### 3. Harness Guides (41 docs — Report Only)
- harness/guides/00-core/scope-control.md:5-8 | 4 em dash pada daftar definisi scope (REQUIRED, NECESSARY, RELATED, OUT-OF-SCOPE) | REPORT ONLY: jangan diedit karena terpasang ke repositori consumer dan dilindungi integritas instalasi | P2
- harness/guides/*.md | nihil kebocoran identitas Notch, Island, Fold, atau Xyn | REPORT ONLY: pertahankan integritas panduan | P2

### 4. Agent Role Definitions (8 roles)
- agents/*.md | terminologi peran (Auditor, Debugger, Interface Designer, Executor, Governor, Researcher, Security Reviewer, Tester) konsisten 100% dengan domain skills dan contracts | pertahankan | P2

### 5. Runtime CLI Output
- src/selection.mjs:91 | pesan error non-TTY hanya menyebut --runtime dan --skills tanpa menyebut --guards untuk CI Harness | perbarui teks pesan error agar menyebut --guards | P1
- src/*.mjs | grep ANSI escape codes menghasilkan 0 | tidak ada warna-only signaling, NO_COLOR didukung alami | P2

### 6. Dokumentasi Sisa dan Batas Brand
- CHANGELOG.md:3,10 | header versi memakai em dash "0.2.1 — Xyeena Rig" dan "0.2.0 — Skills" | ganti em dash dengan colon ":" | P1
- CHANGELOG.md | belum memuat section Unreleased untuk mendokumentasikan pass 1 dan pass 2 | tambahkan section Unreleased tanpa tanggal dan tanpa bump version | P1
- NOTICE.md:6-15 | 6 butir pengaruh riset memakai em dash pemisah | ganti dengan colon ":" | P1
- docs/BRANDING.md:9 | tabel identitas memuat em dash pada nama Xyn | ganti dengan format colon "Xyn: The Lion Guardian" | P1
- docs/ARCHITECTURE.md:9-17 | 9 baris modul kernel menggunakan em dash | ganti dengan colon ":" | P1
- docs/EVALS.md:5-12 | 8 baris daftar tipe evaluasi menggunakan em dash | ganti dengan colon ":" | P1
- docs/RELEASE-ACCEPTANCE.md:1 | judul dokumen memuat em dash | ganti dengan colon ":" | P1

### 7. Usulan Metadata Publik (Non-Repo)
- package.json description | saat ini: "Xyeena Rig: selectable Agent Skills and opt-in project Harness with guardrails, audits, and verification." | usulan: "Xyeena Rig: selectable Agent Skills and opt-in project Harness for Antigravity, Claude Code, and Codex." | P2
- GitHub About | belum diseragamkan | usulan: "Developer tooling for coding agents: selectable Agent Skills + opt-in project Harness. Zero runtime dependencies." | P2
- GitHub Topics | topik repositori di GitHub | usulan: agent-skills, coding-agents, antigravity, claude-code, codex, developer-tools, guardrails, code-quality, verification | P2

