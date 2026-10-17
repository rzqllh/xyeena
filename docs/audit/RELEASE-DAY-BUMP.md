# Release-Day Bump: @0.2.0 to @0.2.1

Tanggal: Operasional saat publish 0.2.1 live di npm.
Tujuan: Mengganti pin versi install sementara `@0.2.0` ke `@0.2.1` setelah paket live di npm registry.

---

## 1. Daftar File dan Baris Aktif Target Bump

Total: 34 baris di 4 file publik.

### `README.md` (17 baris)
- Line 8: `npx xyeena-agent@0.2.0 init` -> `npx xyeena-agent@0.2.1 init`
- Line 49: `npx xyeena-agent@0.2.0 init` -> `npx xyeena-agent@0.2.1 init`
- Line 69: `npx xyeena-agent@0.2.0 init --components skills --runtime codex --skills xyeena-interface --yes` -> `npx xyeena-agent@0.2.1 init --components skills --runtime codex --skills xyeena-interface --yes`
- Line 72: `npx xyeena-agent@0.2.0 init --components harness --guards 00-core,60-security --yes` -> `npx xyeena-agent@0.2.1 init --components harness --guards 00-core,60-security --yes`
- Line 75: `npx xyeena-agent@0.2.0 init --components all --runtime all --skills all --guards all --yes` -> `npx xyeena-agent@0.2.1 init --components all --runtime all --skills all --guards all --yes`
- Line 78: `npx xyeena-agent@0.2.0 init --components all --runtime all --skills all --guards all --dry-run` -> `npx xyeena-agent@0.2.1 init --components all --runtime all --skills all --guards all --dry-run`
- Line 105: `npx xyeena-agent@0.2.0 harness doctor` -> `npx xyeena-agent@0.2.1 harness doctor`
- Line 106: `npx xyeena-agent@0.2.0 audit` -> `npx xyeena-agent@0.2.1 audit`
- Line 107: `npx xyeena-agent@0.2.0 scan` -> `npx xyeena-agent@0.2.1 scan`
- Line 108: `npx xyeena-agent@0.2.0 risk` -> `npx xyeena-agent@0.2.1 risk`
- Line 109: `npx xyeena-agent@0.2.0 changed` -> `npx xyeena-agent@0.2.1 changed`
- Line 110: `npx xyeena-agent@0.2.0 adapters` -> `npx xyeena-agent@0.2.1 adapters`
- Line 111: `npx xyeena-agent@0.2.0 verify` -> `npx xyeena-agent@0.2.1 verify`
- Line 160: `npx xyeena-agent@0.2.0 list` -> `npx xyeena-agent@0.2.1 list`
- Line 168: `npx xyeena-agent@0.2.0 resolve --prompt "grill me on auth architecture" --state DISCOVER` -> `npx xyeena-agent@0.2.1 resolve --prompt "grill me on auth architecture" --state DISCOVER`
- Line 169: `npx xyeena-agent@0.2.0 resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx` -> `npx xyeena-agent@0.2.1 resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx`
- Line 187: `npx xyeena-agent@0.2.0 run-init --goal "Ship reader anchor regression fix"` -> `npx xyeena-agent@0.2.1 run-init --goal "Ship reader anchor regression fix"`

### `docs/GETTING-STARTED.md` (9 baris)
- Line 19: `npx xyeena-agent@0.2.0 init` -> `npx xyeena-agent@0.2.1 init`
- Line 28: `npx xyeena-agent@0.2.0 init --components skills --runtime codex --skills xyeena-interface --yes` -> `npx xyeena-agent@0.2.1 init --components skills --runtime codex --skills xyeena-interface --yes`
- Line 31: `npx xyeena-agent@0.2.0 init --components harness --guards 00-core,60-security --yes` -> `npx xyeena-agent@0.2.1 init --components harness --guards 00-core,60-security --yes`
- Line 34: `npx xyeena-agent@0.2.0 init --components all --runtime all --skills all --guards all --yes` -> `npx xyeena-agent@0.2.1 init --components all --runtime all --skills all --guards all --yes`
- Line 37: `npx xyeena-agent@0.2.0 init --components all --runtime all --skills all --guards all --dry-run` -> `npx xyeena-agent@0.2.1 init --components all --runtime all --skills all --guards all --dry-run`
- Line 56: `npx xyeena-agent@0.2.0 harness doctor` -> `npx xyeena-agent@0.2.1 harness doctor`
- Line 57: `npx xyeena-agent@0.2.0 audit` -> `npx xyeena-agent@0.2.1 audit`
- Line 58: `npx xyeena-agent@0.2.0 scan` -> `npx xyeena-agent@0.2.1 scan`
- Line 59: `npx xyeena-agent@0.2.0 risk` -> `npx xyeena-agent@0.2.1 risk`

### `docs/CLI-REFERENCE.md` (7 baris)
- Line 6: `npx xyeena-agent@0.2.0 help` -> `npx xyeena-agent@0.2.1 help`
- Line 7: `npx xyeena-agent@0.2.0 version` -> `npx xyeena-agent@0.2.1 version`
- Line 10: `Use \`npx xyeena-agent@0.2.0 <command>\`...` -> `Use \`npx xyeena-agent@0.2.1 <command>\`...`
- Line 41: `npx xyeena-agent@0.2.0 changed --base origin/main` -> `npx xyeena-agent@0.2.1 changed --base origin/main`
- Line 42: `npx xyeena-agent@0.2.0 adapters` -> `npx xyeena-agent@0.2.1 adapters`
- Line 43: `npx xyeena-agent@0.2.0 verify --evidence` -> `npx xyeena-agent@0.2.1 verify --evidence`
- Line 57: `npx xyeena-agent@0.2.0 resolve --prompt "review auth changes" --state TRIAGE` -> `npx xyeena-agent@0.2.1 resolve --prompt "review auth changes" --state TRIAGE`

### `site/index.html` (1 baris)
- Line 45: `<code id="install-cmd">npx xyeena-agent@0.2.0 init</code>` -> `<code id="install-cmd">npx xyeena-agent@0.2.1 init</code>`

---

## 2. Pengecualian (JANGAN Diubah)

Baris berikut memuat `@0.2.0` sebagai catatan sejarah, audit log, atau referensi rilis masa lalu yang sah:
- `CHANGELOG.md:45`: referensi rilis upgrade 0.2.0.
- `docs/BRANDING.md:28,32`: dokumentasi sejarah rilis 0.2.0 sebelum Rig branding.
- `docs/HARNESS-V3.1-IMPORT-PLAN.md:8`: log rilis historis 14 Oktober 2026.
- `docs/RELEASE-ACCEPTANCE.md:3`: log rilis historis 14 Oktober 2026.
- `docs/audit/*.md`: dokumen audit internal Pass 1 dan Pass 2.

---

## 3. Urutan Rilis dan Eksekusi Bump

README.md dan docs/ ikut ke dalam tarball npm. Oleh karena itu, urutan bump harus presisi:

### Langkah A: Sebelum Publish (di Commit Rilis)

#### A.1: Swap Versi Dokumen Repositori
Lakukan swap `@0.2.0` ke `@0.2.1` pada 3 file repositori yang masuk tarball:
- `README.md`
- `docs/GETTING-STARTED.md`
- `docs/CLI-REFERENCE.md`

#### A.2: Verifikasi 3 File Repositori Bersih dari `@0.2.0`
```bash
git grep -n "@0.2.0" -- README.md docs/GETTING-STARTED.md docs/CLI-REFERENCE.md
```
Output harus kosong.

#### A.3: Verifikasi Isi Dokumen di Dalam Tarball
Jalankan skrip PowerShell berikut untuk membaca isi dokumen langsung dari tarball tanpa meninggalkan sisa file:

```powershell
$pack = npm pack --pack-destination $env:TEMP --json | ConvertFrom-Json
$tgz = Join-Path $env:TEMP $pack[0].filename
foreach ($f in "README.md","docs/GETTING-STARTED.md","docs/CLI-REFERENCE.md") {
  "== $f"; tar -xzOf $tgz "package/$f" | Select-String "@0\.2\.[01]"
}
Remove-Item $tgz
```

**Dua Ekspektasi Hasil:**
- **Pre-bump (saat ini):** Seluruh hit menampilkan `@0.2.0`, nol hit `@0.2.1`.
- **Post-bump (setelah rilis commit):** Seluruh hit menampilkan `@0.2.1`, nol hit `@0.2.0`.

#### A.4: Pembersihan Prosa Status Rilis yang Ikut Basi
Ketika versi 0.2.1 telah live di npm, kalimat prosa yang menyatakan status pending/staged menjadi tidak akurat dan harus disesuaikan:

1. `README.md:11`:
   - Teks sekarang: `> **Release status:** \`0.2.0\` is the active release on npm. Version \`0.2.1\` (carrying Rig display branding) is staged on \`main\` pending npm release. For local development or CI on this repository, run \`node ./bin/xyeena.mjs init\`.`
   - Tindakan rilis: Hapus seluruh callout block ini.
2. `docs/CLI-REFERENCE.md:3`:
   - Teks sekarang: `The npm package is named **\`xyeena-agent\`** and exposes both \`xyeena\` and \`xyeena-agent\` executables. The current active release on npm is \`0.2.0\`; the Rig-branded release line \`0.2.1\` is staged on main pending npm release.`
   - Tindakan rilis: Hapus kalimat status rilis kedua, sisakan: `The npm package is named **\`xyeena-agent\`** and exposes both \`xyeena\` and \`xyeena-agent\` executables.`
3. `docs/CLI-REFERENCE.md:10`:
   - Teks sekarang: `Use \`npx xyeena-agent@0.2.0 <command>\` for the subcommands listed below. The **Rig** display name is included from \`0.2.1\`; command names remain compatible.`
   - Tindakan rilis: Ubah ke: `Use \`npx xyeena-agent@0.2.1 <command>\` for the subcommands listed below. Command names remain compatible.`
4. `docs/CLI-REFERENCE.md:62`:
   - Teks sekarang: `Rig branding ships in the \`0.2.1\` release line; it does not change historical \`0.2.0\`.`
   - Tindakan rilis: Ubah ke bentuk lampau: `Rig branding shipped in the \`0.2.1\` release line; it does not change historical \`0.2.0\`.`
5. `docs/GETTING-STARTED.md:5`:
   - Teks sekarang: `- **npm package:** [\`xyeena-agent\`](https://www.npmjs.com/package/xyeena-agent): The current live release is \`0.2.0\`; the Rig-branded release line \`0.2.1\` is staged on main pending npm release.`
   - Tindakan rilis: Ubah ke: `- **npm package:** [\`xyeena-agent\`](https://www.npmjs.com/package/xyeena-agent)`
6. `docs/GETTING-STARTED.md:8`:
   - Teks sekarang: `- **Branding note:** Version \`0.2.1\` introduces Xyeena Rig display names. Version \`0.2.0\` is the active npm release; technical package and CLI identifiers remain compatible.`
   - Tindakan rilis: Ubah ke: `- **Branding note:** Version \`0.2.1\` introduces Xyeena Rig display names. Technical package and CLI identifiers remain compatible.`
7. `docs/BRANDING.md:28,32`:
   - Berisi catatan historis rilis 0.2.0 sebelum PR #4 Rig branding. Tetap dipertahankan sebagai arsip penjelasan transisi brand.

**Grep Gate Kedua (Harus Kosong Setelah Rilis):**
```bash
git grep -nE "pending npm release|staged on .?main|active release on npm" -- . ":!CHANGELOG.md" ":!docs/audit"
```
Output command ini harus kosong setelah pembersihan prosa selesai.

#### A.5: Pelipatan Catatan Rilis CHANGELOG.md
Saat commit rilis dibuat:
1. Pindahkan seluruh butir di bawah `## [Unreleased]` (termasuk rekaman Pass 1 landing page, fix non-TTY, isolasi tarball, penambahan changed/adapters, dan audit Pass 2) ke bawah heading `## 0.2.1: Xyeena Rig branding and documentation`.
2. Cantumkan tanggal rilis aktual pada heading `0.2.1` (format: `## 0.2.1 (YYYY-MM-DD): Xyeena Rig branding and documentation`).
3. Kosongkan kembali seksi `## [Unreleased]` untuk siklus pengembangan berikutnya.
4. Pastikan nol karakter em dash di seluruh file.

---

### Langkah B: Publish ke npm Registry
- Dijalankan oleh maintainer/owner repository (di luar scope executor).
- Publikasi otomatis dipicu saat GitHub Release dibuat dengan status published (sesuai workflow `.github/workflows/publish.yml`).

### Langkah C: Verifikasi Paket Live
- Pastikan registry npm telah melayani versi baru:
  ```bash
  npx xyeena-agent@0.2.1 version
  ```
  Output harus mencetak tepat: `0.2.1`.

### Langkah D: Bump dan Deploy Landing Page
- Setelah langkah C terbukti berhasil di registry global, lakukan swap `@0.2.0` ke `@0.2.1` di:
  - `site/index.html` (line 45)
- Deploy static landing page ke hosting provider (Vercel / Cloudflare).

### Langkah E: Cek Akhir Seluruh Repositori
- Jalankan verifikasi menyeluruh untuk memastikan tidak ada sisa `@0.2.0` di file publik aktif:
  ```bash
  git grep -n "@0.2.0" -- . ":!CHANGELOG.md" ":!docs/audit" ":!docs/BRANDING.md" ":!docs/HARNESS-V3.1-IMPORT-PLAN.md" ":!docs/RELEASE-ACCEPTANCE.md"
  ```
  Output harus bersih (0 matches).

---

## 4. Command Verifikasi Tunggal

Jalankan perintah ini setelah seluruh langkah di atas selesai. Output harus kosong:

```bash
git grep -n "@0.2.0" -- . ":!CHANGELOG.md" ":!docs/audit" ":!docs/BRANDING.md" ":!docs/HARNESS-V3.1-IMPORT-PLAN.md" ":!docs/RELEASE-ACCEPTANCE.md"
```

---

## 5. Opsi Tanpa Pin (Tradeoff Analysis)

Setelah versi `0.2.1` live dan menjadi tag `latest` di npm registry, terdapat opsi untuk menggunakan copy perintah tanpa tag versi eksplisit (`npx xyeena-agent init`):

### Kelebihan
- Zero chore per release: tidak membutuhkan penyesuaian manual puluhan baris file setiap rilis patch atau minor berikutnya.
- Pengguna baru selalu menerima versi terbaru secara otomatis tanpa risiko menjalankan versi kadaluarsa.

### Kekurangan
- Hilangnya determinisme instalasi: npx tanpa versi mengeksekusi versi `latest` yang ada di registry pada saat itu, sehingga tidak sepenuhnya reproducible.
- Perilaku instalasi dapat berubah secara diam-diam antar rilis jika terdapat breaking changes atau migrasi baru.
- Perilaku caching npx lokal: jika memilih pola tanpa tag versi tetap, pertimbangkan penulisan `@latest` eksplisit (`npx xyeena-agent@latest init`). Perintah `npx` polos tanpa tag berpotensi mengeksekusi binary yang ter-cache lokal di mesin pengguna tanpa memeriksa pembaruan versi di npm registry (catatan: belum diverifikasi, lakukan pengujian di mesin dengan cache bersih sebelum memilih opsi ini).

Status opsi: **Keputusan owner** (tidak dipilih atau diubah sepihak oleh agent).
