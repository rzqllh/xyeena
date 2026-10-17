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
1. Lakukan swap `@0.2.0` ke `@0.2.1` pada 3 file repositori yang masuk tarball:
   - `README.md`
   - `docs/GETTING-STARTED.md`
   - `docs/CLI-REFERENCE.md`
2. Verifikasi 3 file tersebut bersih dari `@0.2.0`:
   ```bash
   git grep -n "@0.2.0" -- README.md docs/GETTING-STARTED.md docs/CLI-REFERENCE.md
   ```
   (Output harus kosong).
3. Jalankan `npm pack --dry-run` dan buktikan README di tarball memuat `@0.2.1` dan nol `@0.2.0`:
   ```powershell
   tar -tzf (npm pack) | Select-String "README.md"
   ```

### Langkah B: Publish ke npm Registry
- Dijalankan oleh maintainer/owner repository (di luar scope executor).
- Perintah: `npm publish --access public` (atau via GitHub Actions workflow publish).

### Langkah C: Verifikasi Paket Live
- Pastikan registry npm telah melayani versi baru:
  ```bash
  npx xyeena-agent@0.2.1 version
  ```
  Output harus mencetak tepat: `0.2.1`.

### Langkah D: Bump dan Deploy Landing Page
- Setelah langkah C terbukti berhasil, lakukan swap `@0.2.0` ke `@0.2.1` di:
  - `site/index.html` (line 45)
- Deploy static landing page ke provider hosting (Vercel / Cloudflare).

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

Status opsi: **Keputusan owner** (tidak dipilih atau diubah sepihak oleh agent).
