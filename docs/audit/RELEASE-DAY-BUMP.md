# Release-Day Bump: @0.2.0 to @0.2.1

Tanggal: Operasional saat publish 0.2.1 live di npm.
Tujuan: Mengganti pin versi install sementara `@0.2.0` ke `@0.2.1` setelah paket live di npm registry.

---

## 1. Daftar File dan Baris Aktif Target Bump

Total target bump: 34 baris di 4 file publik. Pre-bump, 3 file dokumen di dalam tarball npm memuat tepat 33 hit `@0.2.0` (README.md: 17 hit, docs/GETTING-STARTED.md: 9 hit, docs/CLI-REFERENCE.md: 7 hit), ditambah 1 baris di luar tarball pada `site/index.html`.

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
- Line 10: `Use `npx xyeena-agent@0.2.0 <command>`...` -> `Use `npx xyeena-agent@0.2.1 <command>`...`
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
- **Pre-bump (saat ini):** Tepat 33 hit menampilkan `@0.2.0` (README: 17, GETTING-STARTED: 9, CLI-REFERENCE: 7), nol hit `@0.2.1`.
- **Post-bump (setelah rilis commit):** Tepat 33 hit menampilkan `@0.2.1`, nol hit `@0.2.0`.

#### A.4: Pembersihan Prosa Status Rilis yang Ikut Basi
Ketika versi 0.2.1 telah live di npm, kalimat prosa yang menyatakan status pending atau staged menjadi tidak akurat dan harus disesuaikan pada seluruh 8 baris berikut:

1. `README.md:11`:
   - Teks sekarang: `> **Release status:** `0.2.0` is the active release on npm. Version `0.2.1` (carrying Rig display branding) is staged on `main` pending npm release. For local development or CI on this repository, run `node ./bin/xyeena.mjs init`.`
   - Tindakan rilis: Hapus seluruh callout block ini.
2. `docs/CLI-REFERENCE.md:3`:
   - Teks sekarang: `The npm package is named **`xyeena-agent`** and exposes both `xyeena` and `xyeena-agent` executables. The current active release on npm is `0.2.0`; the Rig-branded release line `0.2.1` is staged on main pending npm release.`
   - Tindakan rilis: Hapus kalimat status rilis kedua, sisakan: `The npm package is named **`xyeena-agent`** and exposes both `xyeena` and `xyeena-agent` executables.`
3. `docs/CLI-REFERENCE.md:10`:
   - Teks sekarang: `Use `npx xyeena-agent@0.2.0 <command>` for the subcommands listed below. The **Rig** display name is included from `0.2.1`; command names remain compatible.`
   - Tindakan rilis: Ubah ke: `Use `npx xyeena-agent@0.2.1 <command>` for the subcommands listed below. Command names remain compatible.`
4. `docs/CLI-REFERENCE.md:62`:
   - Teks sekarang: `Rig branding ships in the `0.2.1` release line; it does not change historical `0.2.0`.`
   - Tindakan rilis: Ubah ke bentuk lampau: `Rig branding shipped in the `0.2.1` release line; it does not change historical `0.2.0`.`
5. `docs/GETTING-STARTED.md:5`:
   - Teks sekarang: `- **npm package:** [`xyeena-agent`](https://www.npmjs.com/package/xyeena-agent): The current live release is `0.2.0`; the Rig-branded release line `0.2.1` is staged on main pending npm release.`
   - Tindakan rilis: Ubah ke: `- **npm package:** [`xyeena-agent`](https://www.npmjs.com/package/xyeena-agent)`
6. `docs/GETTING-STARTED.md:8`:
   - Teks sekarang: `- **Branding note:** Version `0.2.1` introduces Xyeena Rig display names. Version `0.2.0` is the active npm release; technical package and CLI identifiers remain compatible.`
   - Tindakan rilis: Ubah ke: `- **Branding note:** Version `0.2.1` introduces Xyeena Rig display names. Technical package and CLI identifiers remain compatible.`
7. `docs/BRANDING.md:28`:
   - Teks sekarang: `[`xyeena-agent@0.2.0`](https://www.npmjs.com/package/xyeena-agent/v/0.2.0) was published before [the Rig branding PR #4](https://github.com/rzqllh/xyeena/pull/4). GitHub source carries the updated product identity. Version `0.2.1` is the first release line intended to ship Rig branding in npm metadata, npm README and CLI help; it must be published and verified separately. The existing `0.2.0` tarball stays immutable, and the package identifier remains `xyeena-agent`.`
   - Tindakan rilis: Ubah ke bentuk lampau tanpa em dash: `[`xyeena-agent@0.2.0`](https://www.npmjs.com/package/xyeena-agent/v/0.2.0) was published before [the Rig branding PR #4](https://github.com/rzqllh/xyeena/pull/4). GitHub source carries the updated product identity. Version `0.2.1` shipped Rig branding in npm metadata, npm README and CLI help. The existing `0.2.0` tarball stays immutable, and the package identifier remains `xyeena-agent`.`
8. `docs/BRANDING.md:32`:
   - Teks sekarang: ``xyeena-agent@0.2.0` and GitHub tag `v0.2.0` are published, immutable historical release artifacts. This naming change in the repository does **not** alter the published npm version. Publish the separate `0.2.1` patch only after verification; do not rewrite an existing release/tag. Pure documentation changes alone do not warrant further npm version bumps.`
   - Tindakan rilis: Ubah ke bentuk lampau tanpa em dash: ``xyeena-agent@0.2.0` and GitHub tag `v0.2.0` are published, immutable historical release artifacts. The separate `0.2.1` patch was published after verification; historical releases and tags are never rewritten. Pure documentation changes alone do not warrant further npm version bumps.`

**Grep Gate Kedua (Harus Kosong Setelah Rilis):**
```bash
git grep -nEi "pending npm release|staged on|active (npm )?release|must be published and verified|publish the separate" -- . ":!CHANGELOG.md" ":!docs/audit"
```
Output command ini harus kosong setelah pembersihan prosa selesai.

#### A.5: Pelipatan Catatan Rilis CHANGELOG.md
Saat commit rilis dibuat:
1. Pindahkan seluruh butir di bawah `## [Unreleased]` (termasuk rekaman Pass 1 landing page, fix non-TTY, isolasi tarball, penambahan changed/adapters, dan audit Pass 2) ke bawah heading `## 0.2.1: Xyeena Rig branding and documentation`.
2. Cantumkan tanggal rilis aktual pada heading `0.2.1` (format: `## 0.2.1 (YYYY-MM-DD): Xyeena Rig branding and documentation`).
3. Kosongkan kembali seksi `## [Unreleased]` untuk siklus pengembangan berikutnya.
4. Pastikan nol karakter em dash di seluruh file.

---

### Langkah B: Publish ke npm Registry via GitHub Release

Publikasi paket ke npm registry dikelola sepenuhnya oleh workflow automated GitHub Actions [`.github/workflows/publish.yml`](file:///.github/workflows/publish.yml).

#### 1. Mekanisme Trigger Workflow
Workflow hanya terpicu saat GitHub Release resmi diterbitkan dengan status published:

```yaml
# .github/workflows/publish.yml:2-4
on:
  release:
    types: [published]
```

Draft release tidak memicu workflow ini.

#### 2. Ketentuan Penamaan Tag
Tag release harus persis diawali huruf `v` diikuti versi pada `package.json` (`v0.2.1`). Jika tag tidak memiliki prefiks `v` (misalnya `0.2.1`), langkah validasi akan gagal dan membatalkan publish:

```yaml
# .github/workflows/publish.yml:18-24
      - name: Validate release tag and package version
        run: |
          PACKAGE_VERSION="$(node -p 'require("./package.json").version')"
          if [ "$GITHUB_REF_NAME" != "v$PACKAGE_VERSION" ]; then
            echo "::error::Release tag $GITHUB_REF_NAME does not match package version v$PACKAGE_VERSION"
            exit 1
          fi
```

#### 3. Target Commit Release
GitHub Release wajib menargetkan release commit di branch `main` (commit yang sudah memuat bump versi pada 3 file tarball, pembersihan prosa, dan pelipatan changelog).

#### 4. Sifat Rilis: Permanen dan Tak Dapat Ditarik
Menerbitkan release GitHub secara otomatis mempublikasikan tarball ke registry npm global melalui OIDC atau NPM_TOKEN rahasia dengan `--provenance`. Paket npm yang telah dipublikasikan bersifat permanen (immutable) dan tidak dapat ditarik kembali (unpublish) atau ditimpa (overwrite).

#### 5. Checklist Verifikasi Sebelum Menekan "Publish release"
Sebelum menekan tombol "Publish release" di antarmuka GitHub:
1. Grep Gate 1 kosong: `git grep -n "@0.2.0" -- README.md docs/GETTING-STARTED.md docs/CLI-REFERENCE.md` menghasilkan 0 output.
2. Grep Gate Prosa kosong: `git grep -nEi "pending npm release|staged on|active (npm )?release|must be published and verified|publish the separate" -- . ":!CHANGELOG.md" ":!docs/audit"` menghasilkan 0 output.
3. Uji `npm pack` OK: seluruh dokumen di dalam tarball memuat `@0.2.1` dan 0 `@0.2.0`.
4. CI hijau di commit target: Seluruh checks (`npm test`, `npm run test:harness`, `npm run test:consumer`, `npm run check`, `npm run eval`, `npm pack --dry-run`) berstatus lulus di GitHub Actions.

#### 6. Fallback Darurat Manual
Perintah `npm publish --provenance` manual di mesin lokal HANYA digunakan sebagai fallback darurat jika OIDC token exchange di GitHub Actions mengalami gangguan jaringan atau kegagalan infrastruktur GitHub, dan wajib dijalankan dari commit rilis yang bersih dan terverifikasi.

---

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
git grep -nEi "pending npm release|staged on|active (npm )?release|must be published and verified|publish the separate" -- . ":!CHANGELOG.md" ":!docs/audit"
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

