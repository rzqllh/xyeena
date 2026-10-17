# Release-Day Bump: @0.2.0 to @0.2.1

Tanggal: Operasional saat publish 0.2.1 live di npm.
Tujuan: Mengganti pin versi install sementara `@0.2.0` ke `@0.2.1` setelah paket live di npm registry.

## 1. Daftar File dan Baris Aktif Target Bump

Total: 29 baris di 4 file publik.

### `site/index.html` (1 baris)
- Line 44: `<code id="install-cmd">npx xyeena-agent@0.2.0 init</code>` -> `<code id="install-cmd">npx xyeena-agent@0.2.1 init</code>`

### `README.md` (15 baris)
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
- Line 109: `npx xyeena-agent@0.2.0 verify` -> `npx xyeena-agent@0.2.1 verify`
- Line 158: `npx xyeena-agent@0.2.0 list` -> `npx xyeena-agent@0.2.1 list`
- Line 166: `npx xyeena-agent@0.2.0 resolve --prompt "grill me on auth architecture" --state DISCOVER` -> `npx xyeena-agent@0.2.1 resolve --prompt "grill me on auth architecture" --state DISCOVER`
- Line 167: `npx xyeena-agent@0.2.0 resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx` -> `npx xyeena-agent@0.2.1 resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx`
- Line 185: `npx xyeena-agent@0.2.0 run-init --goal "Ship reader anchor regression fix"` -> `npx xyeena-agent@0.2.1 run-init --goal "Ship reader anchor regression fix"`

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

### `docs/CLI-REFERENCE.md` (4 baris)
- Line 6: `npx xyeena-agent@0.2.0 help` -> `npx xyeena-agent@0.2.1 help`
- Line 7: `npx xyeena-agent@0.2.0 version` -> `npx xyeena-agent@0.2.1 version`
- Line 10: `Use \`npx xyeena-agent@0.2.0 <command>\`...` -> `Use \`npx xyeena-agent@0.2.1 <command>\`...`
- Line 51: `npx xyeena-agent@0.2.0 resolve --prompt "review auth changes" --state TRIAGE` -> `npx xyeena-agent@0.2.1 resolve --prompt "review auth changes" --state TRIAGE`

---

## 2. Pengecualian (JANGAN Diubah)

Baris berikut memuat `@0.2.0` sebagai catatan sejarah, audit log, atau referensi rilis masa lalu yang sah:
- `CHANGELOG.md:32`: referensi rilis upgrade 0.2.0.
- `docs/BRANDING.md:28,32`: dokumentasi sejarah rilis 0.2.0 sebelum Rig branding.
- `docs/HARNESS-V3.1-IMPORT-PLAN.md:8`: log rilis historis 14 Oktober 2026.
- `docs/RELEASE-ACCEPTANCE.md:3`: log rilis historis 14 Oktober 2026.
- `docs/audit/*.md`: dokumen audit internal Pass 1 dan Pass 2.

---

## 3. Command Verifikasi Tunggal

Jalankan perintah ini setelah replace selesai. Output harus kosong:

```bash
git grep -n "@0.2.0" -- . ":!CHANGELOG.md" ":!docs/audit" ":!docs/BRANDING.md" ":!docs/HARNESS-V3.1-IMPORT-PLAN.md" ":!docs/RELEASE-ACCEPTANCE.md"
```

