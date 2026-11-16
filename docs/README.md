# Dokumentasi Xyeena Rig

Selamat datang di pusat dokumentasi resmi **Xyeena Rig** — All-in-One Agent Skills & Harness toolkit yang ditenagai oleh **Cortex** native intelligence engine.

Mulailah dengan [Panduan Memulai](GETTING-STARTED.md) untuk memasang skill. Periksa [Status Dukungan & Rilis](STATUS.md) sebelum mengaktifkan eksekusi host atau memilih fitur source yang belum dirilis.

---

## 1. Pemasangan dan Panduan Pengguna

- [Panduan Memulai (Getting Started)](GETTING-STARTED.md) — Panduan instalasi cepat lintas platform.
- [Panduan Instalasi Windows Pemula](INSTALL-WINDOWS-PEMULA.md) — Langkah demi langkah instalasi di Windows dari nol.
- [Panduan Instalasi Global & Mode Symlink](GLOBAL-INSTALL.md) — Manajemen instalasi multi-project di direktori user.
- [Referensi CLI Lengkap](CLI-REFERENCE.md) — Panduan seluruh subperintah dan opsi CLI Xyeena.
- [Adapter Runtime Host](RUNTIME-ADAPTERS.md) — Detail integrasi dengan Antigravity, Gemini, Codex, Claude, dan Hermes.

---

## 2. Arsitektur, Kontrak, dan Kecerdasan

- [Arsitektur Sistem Rebuild](ARCHITECTURE.md) — Desain lapisan sistem, kernel budget L0, dan alur kontrol Cortex.
- [Master Plan & Locked Decisions](../master-plan-141026.md) — Rekonsiliasi master plan dan 31 keputusan pemilik (DEC-01 s.d. DEC-31).
- [Kontrak Kapabilitas Native (64 Contracts)](CAPABILITY-CONTRACT.md) — Spesifikasi lengkap 64 capability contracts di 9 namespace.
- [Perutean Cerdas (Intelligent Routing)](INTELLIGENT-ROUTING.md) — Evaluasi intent, budget supporting skills, dan penentuan tier.
- [Protokol Orchestration](ORCHESTRATION.md) — State machine, single governor, dependency DAG, dan task ledger.
- [Desain Sistem Rig (Deep-Dive)](xyeena-rig/ARCHITECTURE.md) — Invarian keamanan, serialisasi penulisan, dan isolasi worktree.

---

## 3. Operasional, Pengujian, dan Keamanan

- [Runbook Operasional](xyeena-rig/RUNBOOK.md) — Prosedur validasi source, preflight, migrasi, dan pemulihan checkpoint.
- [Status Dukungan dan Rilis](STATUS.md) — Bukti verifikasi lokal vs batasan host aktual.
- [Antigravity Guided Hooks](ANTIGRAVITY-GUIDED.md) — Panduan instalasi dan diagnostik probe lifecycle hooks.
- [Prosedur Evaluasi & Validasi](EVALS.md) — Pengujian deterministik, smoke test, dan paritas perilaku.
- [Panduan Identitas Brand](BRANDING.md) — Pedoman penamaan Xyeena Rig, Cortex, dan package npm.
- [Kebijakan Keamanan](../SECURITY.md) — Model kepercayaan, batasan sandboxing, dan pelaporan kerentanan.
- [Panduan Kontribusi](../CONTRIBUTING.md) — Aturan pengembangan dan standar kualitas kode.

---

## 4. Rencana Upstream dan Register Temuan

- [Future Upstream Integration Roadmap](future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md) — Rencana integrasi komponen upstream berlisensi (DEC-28).
- [Third-Party Provenance Template](future/UPSTREAM_PROVENANCE_TEMPLATE.md) — Ledger pencatatan lisensi, hak cipta, dan atribusi per-file.
- [Bugs & Refinement Register](bugs&refinement/README.md) — Daftar inventaris temuan P0–P3 dan boundary pengujian host.
