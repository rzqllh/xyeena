# Instalasi Xyeena Rig v0.3.0 — Panduan dari nol (Windows)

> **Status:** Panduan ini berlaku untuk **xyeena-agent@0.3.0 setelah versi tersebut terbit di npm**. Sampai saat itu, perintah di bawah tidak akan menginstal kode pengembangan PR #12. Jangan mengasumsikan versi `@latest` sudah berisi v0.3.0.  
> Xyeena Rig adalah paket skill/orkestrasi untuk aplikasi AI yang **sudah ada**. Xyeena tidak otomatis menginstal Codex, Gemini CLI, Claude Code, Antigravity atau Hermes.

## A. Persiapan untuk pemula

1. **Instal Node.js 22.14 atau lebih baru** dari https://nodejs.org. Pilih installer LTS resmi. Setelah selesai, tutup lalu buka ulang PowerShell.
2. Buka **PowerShell biasa** (tidak perlu administrator), kemudian jalankan:

   ```powershell
   node --version
   npm --version
   npx --version
   ```

   Kalau muncul `node is not recognized`, perbaiki instalasi PATH Node.js dan buka terminal baru.
3. Tentukan **folder project** tempat skill akan dipasang, misalnya folder coding. Buka project itu di VS Code atau terminal. Contoh:

   ```powershell
   cd "$HOME\Documents\Code\NamaProject"
   Get-Location
   ```

   Gunakan **folder project**, bukan `C:\Windows`, `Program Files`, `node_modules`, atau folder sistem. Jika folder proyek belum ada, buat dulu di Documents; jangan menginstal ke direktori Hermes sistem.
4. Pastikan aplikasi AI yang ingin dipakai sudah terinstal dan login sesuai petunjuk resminya. Hal ini **terpisah** dari pemasangan Xyeena. Instalasi skill **tidak** meminta API key maupun password.

## B. Cara termudah — wizard empat langkah

**Setelah npm v0.3.0 terbit**, jalankan dari folder project:

```powershell
npx --yes xyeena-agent@0.3.0 setup
```

Keterangan: `npx` mengunduh dan menjalankan CLI Xyeena. Flag `--yes` di atas hanya mengizinkan npm mengambil paket; **wizard Xyeena tetap meminta persetujuan terpisah** sebelum membuat file.

### Langkah 1: Pilih aplikasi AI

Pilihan yang tampil:

| Angka | Aplikasi | Lokasi skill dalam project |
| --- | --- | --- |
| 1 | Hermes / Xyn | `.hermes/skills/` |
| 2 | Gemini CLI | `.gemini/skills/` |
| 3 | Antigravity IDE | `.agents/skills/` |
| 4 | OpenAI Codex | `.agents/skills/` |
| 5 | Claude Code | `.claude/skills/` |

Jika memakai Hermes **dan** Gemini CLI, ketik `1,2`. Kalau hanya Hermes, ketik `1`. Pilih berdasarkan AI yang **memang ingin digunakan**, bukan tebakan folder. Antigravity dan Codex sama-sama dapat memakai `.agents/skills/`, tetapi implementasi host tetap berbeda.

### Langkah 2: Pilih ukuran skill

- **1 — Essential (direkomendasikan untuk mencoba):** hanya `xyeena-orchestrate` dan skill yang wajib sebagai dependency.
- **2 — Balanced:** orchestrator, debugging, planning, review, testing, verification serta dependencies.
- **3 — Complete:** seluruh 19 skill Xyeena. Ini **tidak** berarti 19 skill akan dijalankan otomatis di setiap prompt; orkestrator harus memilih yang relevan.

Skill pihak ketiga yang sudah ada di workspace **tidak akan dihapus atau otomatis disalin**. Xyeena hanya membacanya sebagai kandidat berdasarkan inventaris host yang berlaku.

### Langkah 3: Pilih Harness (opsional)

- **1 — None:** cukup pasang skill; cocok untuk mencoba terlebih dahulu.
- **2 — Essential:** tiga kelompok panduan keamanan/proses: Core, Quality, Security.
- **3 — Full:** semua 11 kelompok, total 41 guardrail dokumen.

Harness adalah **dokumen dan pemeriksaan**, bukan auto-approval atau kebebasan penuh menjalankan perintah.

### Langkah 4: Review dan konfirmasi

Wizard menampilkan runtime, preset, dependency tambahan, jumlah file, dan contoh lokasi yang akan dibuat. Periksa semuanya. Jawab `y` jika setuju atau `n` untuk membatalkan tanpa menulis file.

Xyeena tidak menimpa file yang sudah dimodifikasi. Jika ada konflik, wizard menawarkan dua pilihan: **(1) pertahankan file custom** atau **(2) backup kemudian update dari paket**. Pilihan bawaan mempertahankan file lama. File asli yang diganti akan tersalin ke `.xyeena/backups/` dengan struktur folder yang sama. Jangan hapus backup sebelum memeriksa hasilnya.

## C. Kalau tidak mau pakai wizard

Untuk komputer kantor, CI, atau terminal non-interaktif, periksa dulu dengan `--dry-run`:

```powershell
# Preview pemasangan Essential untuk Hermes (TIDAK menulis file).
npx --yes xyeena-agent@0.3.0 setup --runtime hermes --preset essential --dry-run

# Setelah yakin, eksekusi eksplisit.
npx --yes xyeena-agent@0.3.0 setup --runtime hermes --preset essential --yes
```

Contoh kombinasi Hermes + Gemini CLI dengan perlindungan Harness:

```powershell
npx --yes xyeena-agent@0.3.0 setup --runtime "hermes,gemini" --preset balanced --harness essential --dry-run
npx --yes xyeena-agent@0.3.0 setup --runtime "hermes,gemini" --preset balanced --harness essential --yes
```

Nilai `--preset`: `essential`, `balanced`, `complete`. Nilai `--harness`: `none`, `essential`, `full`. Pilihan host: `antigravity`, `codex`, `gemini`, `claude`, `hermes`.

## C2. Update instalasi lama (tanpa kehilangan file custom)

Jika sebelumnya pernah menginstal Xyeena lalu mendapat konflik `.agents/skills/xyeena-orchestrate/SKILL.md`, **jangan menghapus folder `.agents`**. Skill lain bisa berada di sana.

Untuk memilih sendiri cara penyelesaiannya, ulangi `setup` terbaru. Setelah tiga pilihan awal, jika menemukan konflik, wizard menampilkan file yang berbeda dan menawarkan:

- **1 — Keep existing:** file yang sudah dimodifikasi dipertahankan; hanya file yang belum tersedia dipasang.
- **2 — Backup + replace:** file lama disalin terlebih dahulu ke `.xyeena/backups/<waktu>-<id>/`, baru diganti dengan isi paket.
- **0 — Cancel:** tidak melakukan perubahan.

Untuk melakukan update eksplisit tanpa wizard:

```powershell
# Jika menggunakan GitHub release candidate, pakai $pkg yang mengarah ke commit yang baru.
npx --yes --package $pkg xyeena setup --runtime antigravity --preset complete --harness full --update --dry-run
npx --yes --package $pkg xyeena setup --runtime antigravity --preset complete --harness full --update --yes
```

`--update` berarti **backup sebelum replace**, bukan menghapus file custom. File pihak ketiga yang tidak berasal dari paket Xyeena tidak disentuh. Perintah `--force` *tidak* didukung oleh wizard beginner; salah ketik seperti `--froce` sekarang ditolak sebagai opsi tak dikenal. Jangan menaruh `--force` sebelum `$pkg`, karena `npx` akan menafsirkannya sebagai argumen npm.

## C3. Beda file, update sebagian, dan rollback

Untuk melihat **perbedaan sebuah file** sebelum memilih ganti, gunakan `setup diff` dan tentukan `--file` sesuai nama yang muncul di daftar `conflicts`. Contoh:

```powershell
npx --yes --package $pkg xyeena setup diff --runtime antigravity --preset complete --harness full --file ".agents/skills/xyeena-orchestrate/SKILL.md"
```

Bila hanya ingin memperbarui `xyeena-orchestrate` tetapi mempertahankan `.agents/rules/xyeena-core.md` yang sudah disunting:

```powershell
npx --yes --package $pkg xyeena setup --runtime antigravity --preset complete --harness full --replace-files ".agents/skills/xyeena-orchestrate/SKILL.md" --dry-run
npx --yes --package $pkg xyeena setup --runtime antigravity --preset complete --harness full --replace-files ".agents/skills/xyeena-orchestrate/SKILL.md" --yes
```

Atau pilih opsi **3 — Choose specific conflicting files** dalam wizard. Semua file yang benar-benar diganti mendapat backup sebelum replace.

### Rollback yang aman

Instalasi yang memakai versi baru menyimpan jurnal perubahan di `.xyeena/backups/<ID>/rollback.json`. Cari ID backup dan pratinjau lebih dulu:

```powershell
npx --yes --package $pkg xyeena setup backups
npx --yes --package $pkg xyeena setup rollback --id "ID_DARI_HASIL" --dry-run
npx --yes --package $pkg xyeena setup rollback --id "ID_DARI_HASIL" --yes
```

Rollback baru dapat memulihkan **file yang dibackup dan file yang dibuat oleh instalasi spesifik itu saja**. Bila file tersebut sudah diedit setelah pemasangan, rollback otomatis akan menolak agar edit selanjutnya tidak hilang. Backup terdahulu yang **tidak punya `rollback.json`**, seperti backup dari instalasi kandidat sebelumnya, **tidak bisa di-rollback otomatis**; lakukan pemulihan manual dari salinan file di folder backup tersebut. Jangan menghapus backup tanpa memeriksa hasilnya.

### Pemeriksaan sesudah instalasi

```powershell
npx --yes --package $pkg xyeena setup check --runtime antigravity
```

Perintah ini hanya mengecek manifest, keberadaan skill, metadata, dan petunjuk executable/config host. Status "detected" **bukan** bukti bahwa Antigravity berhasil memuat/menjalankan skill di chat aktif.

## D. Cek hasil dan jalankan Xyeena

```powershell
# Status instalasi yang tercatat di proyek
npx --yes xyeena-agent@0.3.0 doctor --dir .

# Inventaris skill nyata untuk setiap host (hanya baca file)
npx --yes xyeena-agent@0.3.0 skills matrix --local-only

# Preview keputusan orkestrator TANPA memanggil model/biaya token
npx --yes xyeena-agent@0.3.0 orchestrate preview --runtime hermes --goal "Review test yang gagal"
```

Buka ulang aplikasi AI yang digunakan. Di chat agent, minta:

> Gunakan skill xyeena-orchestrate untuk mengerjakan tugas ini. Scan skill yang benar-benar tersedia di project, pilih yang relevan, jangan mengarang skill, dan tetap minta persetujuan sebelum tindakan sensitif.

Pemanggilan `/xyeena-orchestrate` bergantung pada apakah host mengenali skill itu sebagai slash command. **Tidak semua host menggunakan sintaks slash yang sama.** Pada beberapa host cukup instruksi natural tersebut.

Jika ingin menjalankan **panggilan model baru lewat terminal** (bukan melanjutkan chat yang sudah terbuka), gunakan:

```powershell
npx --yes xyeena-agent@0.3.0 orchestrate run --runtime hermes --goal "Review test yang gagal" --yes
```

Flag `--yes` dalam Xyeena berarti **setuju melakukan satu model call**. Jalur ini dirancang read-only dan mengembalikan status `REVIEW_REQUIRED`, bukan bukti pekerjaan sudah sempurna. Provider mungkin memakai token/biaya sesuai akun Anda. Kredensial tetap dikelola Hermes/Gemini/Codex/Claude, bukan Xyeena.

## E. Catatan penting masing-masing host

**Hermes/Xyn:** Profile dapat menggunakan `HERMES_HOME`; pastikan project termasuk repository Git dan telah dinyatakan trusted oleh Hermes sebelum mengandalkan project-local skill. Xyeena tidak membuat trust secara otomatis dan tidak mengubah konfigurasi Telegram/gateway. Pakai perintah keterampilan yang didukung oleh versi Hermes terinstal untuk memeriksa trust dan statusnya.

**Gemini CLI:** Login Gemini CLI sendiri. Instalasi Xyeena ke `.gemini/skills` tidak mengubah akun Google atau provider API. Auto-invocation dikendalikan oleh host.

**Antigravity:** Installer menempatkan skill `.agents/skills`. Guided Hooks dapat dipasang secara **terpisah** lewat `xyeena guided preview`, lalu `xyeena guided install --yes` setelah memeriksa izin dan backup. Native IDE/session end-to-end berbeda dari eksekusi one-shot SDK.

**Codex / Claude Code:** Gunakan folder project masing-masing dan pastikan host memuat skill tersebut. Tidak ada instalasi Git hooks atau penerapan izin permanen.

## F. Instalasi via npm biasa (opsional)

Tidak wajib menginstal secara global. Kalau ingin versi yang **dipin** sebagai dependency proyek:

```powershell
npm install --save-dev xyeena-agent@0.3.0
npx xyeena setup
```

Ini dapat membuat/memperbarui `package.json` dan `package-lock.json` milik project, seperti npm biasanya. Untuk **tanpa perubahan package dependency**, cukup gunakan metode `npx --yes xyeena-agent@0.3.0 setup` pada bagian B.

## G. Troubleshooting

| Masalah | Penyebab umum dan tindakan |
| --- | --- |
| `node` / `npx` tidak ditemukan | Instal Node.js 22.14+; buka ulang terminal dan cek PATH. |
| `No matching version found` | Versi belum dipublish. Jangan ganti diam-diam ke `@latest`; periksa status release. |
| Project `not found` | Masuk ke folder project yang ada terlebih dulu, lalu `Get-Location`. |
| Ada conflict pada file skill | Pilih 1 untuk menjaga file lama, atau 2 agar file lama dibackup dulu lalu di-update. |
| `requires-host-trust` (Hermes) | Proyek belum dipercaya di Hermes. Konfirmasikan trust menggunakan fitur Hermes sendiri, bukan Xyeena. |
| Orchestrator tak muncul di chat | Pastikan runtime yang dipilih sesuai, folder terpasang benar, reload host dan cek `skills matrix`. |
| Model login/API error | Login di runtime/provider terkait. Xyeena tidak menyimpan API keys lewat wizard. |
| Hasil `REVIEW_REQUIRED` | Normal: jawaban model bukan bukti verifikasi independen. |

## H. Privasi, rollback dan upgrade

- Wizard bekerja hanya di project tujuan dan menolak overwrite file yang dimodifikasi. Jangan jalankan lewat administrator kecuali benar-benar dibutuhkan.
- Data instalasi lokal disimpan dalam `.xyeena/install.json`. Pemasangan Harness tidak mengaktifkan hooks, model calls, atau background daemon.
- Sebelum upgrade, jalankan `git status --short` dan backup skill custom. Kemudian lakukan `setup --dry-run` terhadap versi yang ingin dipakai. Installer mempertahankan file custom secara default, dan memerlukan pilihan `--update` atau persetujuan eksplisit di wizard untuk backup serta menggantinya.
- **Tidak ada perintah uninstall otomatis dalam setup v0.3.0**. Jika ingin rollback, tinjau manifest instalasi dan Git diff lalu hapus hanya file yang dipasang oleh Xyeena. Jangan menghapus direktori `.agents` atau `.hermes` secara keseluruhan karena mungkin berisi skill lain.
