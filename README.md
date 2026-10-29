# Xyeena Rig

Xyeena Rig menyediakan 19 skill untuk membantu agent melakukan riset, perencanaan, coding, pengujian, dan review. Kamu memilih skill serta host yang digunakan. Harness opsional menambahkan panduan dan pemeriksaan pada proyek.

Host yang memiliki integrasi instalasi: Antigravity, Codex, Claude Code, Gemini CLI, dan Hermes. Dukungan instalasi berbeda dari kemampuan host untuk menegakkan izin. Periksa [status dukungan](docs/STATUS.md) sebelum mengandalkannya untuk tindakan berisiko.

Baseline rilis yang dicatat repository adalah `xyeena-agent@0.4.1`. Source terbaru memiliki fitur **unreleased** yang belum otomatis tersedia dalam paket tersebut. Live host acceptance masih terbatas.

## Instalasi

Siapkan Node.js 22.14 atau lebih baru dan host agent yang ingin kamu gunakan.

```sh
npx --yes xyeena-agent@0.4.1 setup
```

Pilih scope, host, dan preset skill. Periksa tujuan file sebelum menyetujui perubahan. Setelah selesai, muat ulang host dan periksa daftar skill-nya. Installer tidak memasukkan akun AI atau mengaktifkan izin host untukmu.

Untuk melihat rencana tanpa menulis file:

```sh
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime codex --preset balanced --dry-run
```

Ikuti [panduan mulai](docs/GETTING-STARTED.md) atau [instalasi Windows](docs/INSTALL-WINDOWS-PEMULA.md) untuk langkah lengkap.

## Pilih yang diperlukan

| Komponen | Kegunaan |
| --- | --- |
| Skill | Panduan kerja agent untuk tugas tertentu |
| Discovery | Menemukan skill terpasang dan memeriksa dependensinya |
| Orchestration | Menentukan alur tugas dan bukti hasil yang diperlukan |
| Harness | Panduan serta pemeriksaan proyek yang dipasang secara opt-in |
| Adapter host | Menghubungkan fitur source tertentu dengan host yang tersedia |

Simpul merupakan integrasi worker opsional dan proyek terpisah. Memasang Xyeena tidak memerlukan Simpul atau produk Xyeena Notch.

## Penggunaan sehari-hari

```sh
npx --yes xyeena-agent@0.4.1 list
npx --yes xyeena-agent@0.4.1 setup check --runtime codex
npx --yes xyeena-agent@0.4.1 audit
```

`setup check` menemukan petunjuk instalasi; hasilnya tidak membuktikan host sedang menjalankan skill. Perintah `verify` menjalankan pemeriksaan yang dikonfigurasi proyek, jadi baca perintah tersebut sebelum mengeksekusinya.

## Fitur pada source terbaru

Compact setup, preflight, dan adapter yang lebih baru harus dijalankan dari checkout source yang sesuai. Contoh pratinjau:

```sh
node bin/xyeena.mjs setup compact --runtime codex --preset balanced --dry-run
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Review a failing test"
node bin/xyeena.mjs ops preflight --dir .
```

Periksa [referensi CLI](docs/CLI-REFERENCE.md) untuk efek setiap perintah. Operasi yang menjalankan model memerlukan izin tersendiri dan dapat menggunakan kuota provider. Pemeriksaan token setelah eksekusi bukan batas tagihan provider.

## Keamanan dan rilis

Host tetap mengendalikan izin. Antigravity CLI 1.4.7 pernah menunjukkan prompt izin dan penolakan terbatas pada Windows; IDE 2.5.5 tidak menegakkan hook pada pengamatan yang dicatat. Jangan menganggap pemasangan berhasil berarti perlindungan aktif di semua host.

Source belum menjadi publikasi 0.5.0. Penerbitan membutuhkan pemeriksaan paket, bukti untuk scope host yang didukung, konfigurasi publishing, dan persetujuan pemilik. [Status rilis](docs/STATUS.md) mencatat dukungan serta batas yang belum selesai.

## Dokumentasi dan kontribusi

| Tujuan | Bacaan |
| --- | --- |
| Memasang atau menghapus instalasi | [Panduan mulai](docs/GETTING-STARTED.md), [scope global](docs/GLOBAL-INSTALL.md), [operasional](docs/xyeena-rig/RUNBOOK.md) |
| Memahami perintah dan host | [CLI](docs/CLI-REFERENCE.md) dan [adapter](docs/RUNTIME-ADAPTERS.md) |
| Mengembangkan integrasi | [Arsitektur](docs/ARCHITECTURE.md) dan [orchestration](docs/ORCHESTRATION.md) |
| Memeriksa batas keamanan | [Security](SECURITY.md) dan [status dukungan](docs/STATUS.md) |
| Berkontribusi | [Contributing](CONTRIBUTING.md) |

Lihat [indeks dokumentasi](docs/README.md) untuk seluruh panduan. Kode menggunakan [MIT](LICENSE); pertahankan [NOTICE.md](NOTICE.md) dan lisensi upstream saat redistribusi.
