# Xyeena Rig — Panduan Instalasi Windows dari Nol

## Hanya satu perintah

**1.** Instal Node.js 22.14 atau lebih baru dari https://nodejs.org. Buka PowerShell biasa (tanpa Run as administrator). Ketik node --version untuk memastikan Node.js sudah tersedia.

**2.** Jalankan:

~~~powershell
npx --yes xyeena-agent setup
~~~

Tidak perlu GitHub URL, Git clone, atau instalasi npm global. npx mengunduh dan menjalankan paket; wizard Xyeena akan meminta konfirmasi tersendiri sebelum menulis file.

**3.** Jawab pertanyaan wizard:

- **Lokasi:** 1 Global (direkomendasikan, untuk semua project di akun Windows ini) atau 2 Workspace (hanya project yang sedang dibuka). Global bisa dipilih dari folder mana pun.
- **Aplikasi AI:** pilih angka Hermes Agent, Gemini CLI, Antigravity IDE, Codex, atau Claude Code yang benar-benar digunakan. Pilih beberapa dengan koma, misalnya 2,3.
- **Paket skills:** Essential (paling ringan), Balanced (untuk pekerjaan coding umum), atau Complete (semua 19 skills).
- **Metode:** Jika memilih **Global**, skill otomatis di-*Copy* ke direktori pengguna setiap AI; tidak perlu memilih metode lagi. Jika **Workspace**, pilih Copy atau Symlink, lalu Harness None, Essential, atau Full.
- **Review:** periksa lokasi file yang akan dibuat, lalu jawab y untuk lanjut atau n untuk batal. File custom existing dipertahankan secara default.

Xyeena tidak menginstal aplikasi AI, tidak melakukan login akun, tidak membuat Git hooks, dan tidak menjalankan model saat setup.

Setelah instalasi Global, Xyeena menampilkan lokasi dan jumlah file skill yang cocok dengan paket untuk setiap AI. **Pemeriksaan file ini berbeda dari aktivasi skill di aplikasi**—buka ulang aplikasi AI untuk memastikannya.

## Bedanya Copy dan Symlink

**Copy** membuat salinan skill langsung pada folder masing-masing aplikasi. Ini pilihan terbaik bagi pengguna baru.

**Symlink** membuat Windows directory junction ke sumber bersama pada folder C:\Users\<akun>\.xyeena\skill-store\v<VERSI>\. Sumber ini disalin terlebih dahulu dari paket npm ke lokasi yang permanen. Jadi link tidak putus ketika cache npx dibersihkan. Jangan menghapus folder skill-store bila masih ada junction yang menggunakannya.

## Lokasi global tiap AI

| AI | Lokasi global di Windows |
| --- | --- |
| Antigravity IDE | %USERPROFILE%\.gemini\config\skills\ |
| Gemini CLI | %USERPROFILE%\.gemini\skills\ |
| Codex | %USERPROFILE%\.agents\skills\ |
| Claude Code | %USERPROFILE%\.claude\skills\ |
| Hermes Agent | %USERPROFILE%\.hermes\skills\ (bisa berbeda bila memakai profil HERMES_HOME) |

Antigravity CLI punya lokasi berbeda dari Antigravity IDE. Setup ini memilih target IDE. Global berarti berlaku di seluruh project bagi AI terpilih, bukan mengaktifkan semua aplikasi sekaligus.

## Cek apakah sudah terpasang

~~~powershell
npx --yes xyeena-agent skills matrix
npx --yes xyeena-agent setup check --runtime antigravity
~~~

Periksa juga Customizations pada Antigravity IDE, atau /skills list pada Gemini CLI. Status detected hanya menunjukkan skill ditemukan di filesystem, bukan bukti bahwa AI sudah menjalankannya.

## Opsi tanpa wizard (untuk pengguna lanjut)

Global Antigravity, semua 19 skill:

~~~powershell
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --dry-run
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --yes
~~~

**Opsi advanced saja:** Global Antigravity + Gemini CLI dengan mode symlink (tidak ditawarkan wizard Global):

~~~powershell
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "antigravity,gemini" --preset complete --dry-run
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "antigravity,gemini" --preset complete --yes
~~~

Pakai tanda kutip ketika menyebut beberapa runtime di PowerShell.

## Konflik, update dan keamanan

Jika sebuah skill sudah ada tetapi isinya berbeda, installer menyimpannya secara default. Periksa --dry-run lebih dulu. Jika ingin mengganti file lama dengan versi Xyeena baru, gunakan --update dengan konfirmasi --yes; file lama disalin ke backup sebelum diganti. Symlink asing dan skill-store yang sudah dimodifikasi akan ditolak.

Harness tetap **khusus workspace**. Menginstal skill global tidak otomatis menerapkan aturan project atau memberi persetujuan tool permanen.

Untuk instalasi global dan symlink, backup portable dapat dipulihkan manual setelah inspeksi; perintah setup rollback terdahulu berlaku untuk workspace copy yang memiliki jurnal rollback, bukan seluruh global symlink. Jangan menghapus seluruh direktori .agents, .gemini, atau .hermes karena mungkin berisi skill dari aplikasi lain.

Untuk penjelasan lebih lengkap, lihat [Panduan Global dan Symlink](GLOBAL-INSTALL.md).
