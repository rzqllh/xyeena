# Xyeena Rig

**Xyeena Rig** adalah toolkit All-in-One Agent Skills dan project Harness yang ditenagai oleh **Cortex** — native orchestration intelligence engine. Proyek ini menyediakan 19 packaged skills dan 64 native capability contracts untuk membantu AI agent melakukan riset, perencanaan, desain, coding, pengujian, dan review secara disiplin dan berbasis bukti.

Kamu memegang kendali penuh atas skill, preset, dan host runtime yang digunakan. Harness opsional menambahkan panduan dan pemeriksaan pada proyek.

Host yang memiliki integrasi instalasi: **Antigravity**, **Gemini CLI**, **OpenAI Codex**, **Claude Code**, dan **Hermes Agent**. Perlu dicatat: dukungan instalasi berbeda dari kemampuan host untuk menegakkan izin. Periksa [status dukungan](docs/STATUS.md) sebelum mengandalkannya untuk tindakan berisiko.

Baseline rilis yang dicatat repository npm adalah `xyeena-agent@0.4.1`. Source rebuild terbaru pada branch pengembangan memiliki fitur **unreleased** (64 capability contracts, Cortex engine, dan transactional conditional installer) yang belum dipublikasikan ke npm.

---

## Fitur Utama

- **Cortex Native Engine (DEC-27):** Intelligence layer default yang aktif secara native. Tugas berbiaya rendah (mikro) diselesaikan langsung tanpa overhead (< 5ms); tugas kompleks dieksekusi melalui composite skills, DAG planning, dan quality gates.
- **19 Packaged Skills & 64 Capability Contracts (DEC-31):** 19 folder skill standar Agent Skills (`skills/`) ditambah 64 capability contracts executable terbagi dalam 9 namespace (`thinking`, `design`, `engineering`, `quality`, `security`, `coordination`, `delivery`, `knowledge`, `extensibility`).
- **Transactional Conditional Installer (DEC-26, DEC-29):** Installer aman dengan Hybrid Diff Gate. Mendeteksi file yang telah dimodifikasi pengguna, mewajibkan konfirmasi fingerprint diff untuk modifikasi, default mode `copy` pada Windows (symlink/junction hanya atas permintaan eksplisit), mempertahankan custom file pengguna saat uninstall, dan mendukung rollback otomatis.
- **Adaptive Artifact Governance (DEC-30):** Menghasilkan deliverable persisten (plan, audit, ADR) secara kontekstual sesuai kebutuhan dan permintaan eksplisit pengguna, tanpa membanjiri workspace dengan artefak sementara.
- **Epistemic Evidence Standards (DEC-07):** Memisahkan status kontrak, verifikasi perilaku empiris, paritas komparatif, dan aktivasi host aktual secara jujur.

---

## Instalasi Cepat

Siapkan **Node.js 22.14** atau lebih baru dan host agent yang ingin kamu gunakan.

### Menggunakan Paket npm Publik (v0.4.1)

```sh
npx --yes xyeena-agent@0.4.1 setup
```

Pilih scope (`global` atau `workspace`), host, dan preset skill (`essential`, `balanced`, atau `complete`). Periksa tujuan file sebelum menyetujui perubahan. Installer tidak memasukkan akun AI atau mengaktifkan izin host untukmu.

Untuk melihat pratinjau tanpa menulis file (dry-run):

```sh
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime codex --preset balanced --dry-run
```

Ikuti [panduan mulai](docs/GETTING-STARTED.md) atau [instalasi Windows](docs/INSTALL-WINDOWS-PEMULA.md) untuk langkah lengkap.

---

## Menjalankan dari Source Rebuild Terbaru

Untuk menggunakan fitur rebuild terbaru (Cortex, 64 capability contracts, installer transaksional):

```sh
# Periksa status Cortex default intelligence layer
node bin/xyeena.mjs cortex status

# Inspeksi routing dan tier tugas dari prompt
node bin/xyeena.mjs cortex inspect --prompt "Review a failing authentication test"

# Instalasi transaksional aman (default copy di Windows)
node bin/xyeena.mjs install --runtime antigravity --scope workspace --dry-run
node bin/xyeena.mjs install --runtime antigravity --scope workspace --yes

# Validasi seluruh skill dan 64 capability contracts
node bin/xyeena.mjs check --source .
```

---

## Komponen Xyeena Rig

| Komponen | Kegunaan |
| :--- | :--- |
| **Cortex** | Native orchestration engine yang merutekan dan mengeksekusi capability secara cerdas |
| **Skills (19)** | Panduan kerja agent berstandar Agent Skills (`skills/`) |
| **Capabilities (64)** | Kontrak kemampuan fungsional native executable (`src/core/default-registry.mjs`) |
| **Harness v3.1** | Aturan dan guardrail verifikasi proyek yang dipasang secara opt-in |
| **Transactional Installer** | Pemasangan aman dengan Hybrid Diff Gate, backup, dan proteksi modifikasi pengguna |
| **Host Adapters** | Menghubungkan kemampuan Xyeena dengan runtime Antigravity, Gemini, Codex, Claude, Hermes |

Simpul merupakan integrasi worker opsional dan proyek terpisah. Memasang Xyeena tidak memerlukan Simpul atau produk Xyeena Notch.

---

## Keamanan dan Batasan

Host runtime tetap mengendalikan izin dan eksekusi:
- **Antigravity CLI 1.4.7** pernah menunjukkan prompt izin dan penolakan terbatas pada Windows; **Antigravity IDE 2.5.5** tidak menegakkan hook pada pengamatan yang dicatat.
- Memasang skill di filesystem tidak otomatis berarti host mengaktifkan perlindungan atau mengeksekusi hook di sesi live.
- Penerbitan versi paket npm baru (`0.5.0`+) memerlukan persetujuan pemilik, pemeriksaan paket, dan verifikasi CI.

Lihat [Kebijakan Keamanan](SECURITY.md) dan [Status Rilis](docs/STATUS.md) untuk detail batas keamanan.

---

## Dokumentasi Lengkap

| Kategori | Dokumen |
| :--- | :--- |
| **Mulai & Panduan** | [Getting Started](docs/GETTING-STARTED.md) • [Windows Pemula](docs/INSTALL-WINDOWS-PEMULA.md) • [Global Install](docs/GLOBAL-INSTALL.md) • [CLI Reference](docs/CLI-REFERENCE.md) |
| **Arsitektur & Kontrak** | [Master Architecture](master-plan-141026.md) • [Arsitektur Sistem](docs/ARCHITECTURE.md) • [Capability Contracts](docs/CAPABILITY-CONTRACT.md) • [Intelligent Routing](docs/INTELLIGENT-ROUTING.md) • [Orchestration](docs/ORCHESTRATION.md) |
| **Operasional & Keamanan** | [Support Status](docs/STATUS.md) • [Runtime Adapters](docs/RUNTIME-ADAPTERS.md) • [Security Policy](SECURITY.md) • [Runbook](docs/xyeena-rig/RUNBOOK.md) • [Branding](docs/BRANDING.md) |
| **Future & Refinement** | [Future Roadmap](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md) • [Provenance Template](docs/future/UPSTREAM_PROVENANCE_TEMPLATE.md) • [Bugs & Refinement Register](docs/bugs&refinement/README.md) |

Lihat [Indeks Dokumentasi](docs/README.md) untuk seluruh panduan. Kode menggunakan lisensi [MIT](LICENSE); pertahankan [NOTICE.md](NOTICE.md) saat redistribusi.
