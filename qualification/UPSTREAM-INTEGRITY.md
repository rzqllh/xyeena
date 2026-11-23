# Veyra v1.0 — Upstream Provenance (Corrected)

| Layer | Evidence | Status |
| --- | --- | --- |
| Lockfile metadata | 21 pinned repositories declared | LOCKFILE_VALID reported |
| Local ZIP | SHA-256 b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f reported by Windows runner | LOCAL_ARCHIVE_HASH_REPORTED |
| ZIP central directory | 45,640 entries reported | ARCHIVE_ENTRY_PRESENCE_REPORTED |
| Actual archive contents in this audit | Archive binary not committed or independently rehashed | NOT_INDEPENDENTLY_VERIFIED |
| Pinned Git commit contents | No 21 git HEAD / tree object proofs | SOURCE_SHA_NOT_VERIFIED |
| references/manifest.json | File presence and size only | LEDGER_CONTENTS_NOT_VERIFIED |

A ZIP checksum proves identity of a particular byte sequence if reproduced against the genuine archive; it does not prove each folder was generated from the claimed Git commit. Full source verification requires pinned Git object checks or equivalent independent content hash reconciliation.
Do not present 21/21 SOURCE_SHA_VERIFIED without those receipts.
