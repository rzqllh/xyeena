# Veyra v1.0 — Upstream Provenance (Verified)

| Layer | Evidence | Status |
| --- | --- | --- |
| Lockfile metadata | 21 pinned repositories declared in `references/upstreams.lock.json` | LOCKFILE_VALID |
| Pinned Git commit objects | 21/21 exact 40-character Git commit objects physically verified and stored in Git database (`git cat-file -t commit`) | SOURCE_OBJECT_VERIFIED (21/21) |
| Local ZIP archive | SHA-256 `b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f` reported | LOCAL_ARCHIVE_HASH_REPORTED |
| Central directory | 45,640 entries reported | ARCHIVE_ENTRY_PRESENCE_REPORTED |
| Actual archive contents | Payload matched by hash across 45,637 entries | PAYLOAD_HASH_MATCHED |
| references/manifest.json | Ledger present | LEDGER_PRESENT |

### Pinned Git Commits Verified (21/21)
All 21 upstream repositories have had their exact 40-character Git commit objects physically verified via `git cat-file -t commit` and `git log -n 1 --oneline`:
1. `obra/superpowers`: `22f0b463e7a5e579904dd6211a520321035526f7`
2. `obra/superpowers-skills`: `cdcd624ad3fd8026deb692e565351854569798dd`
3. `KodekaTeam/superior-skills`: `b600920ec07a4f3f426405882c42f77d5c245ad9`
4. `miqdadbadjuber/anti-slop`: `1969b459f843603ba2efbbb24e8e1bf963c889b3`
5. `DietrichGebert/ponytail`: `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`
6. `JuliusBrussee/caveman`: `1997d6ee3426e95d52fc1a473ee16ba5a5135111`
7. `cloudflare/security-audit`: `9736ce153d8e57ee7a1f5a544dfa8b1bf762bcf9`
8. `pbakaus/impeccable`: `b49177d32788f2dc585c42831d845dacf1ebed2c`
9. `mattpocock/skills`: `abeeaf95660ba9e8b7c753eb38f441ca707a8823`
10. `Nutlope/hallmark`: `df6aa4e2bc615cb325f187a419eb9bf71cf042ce`
11. `Leonxlnx/taste`: `22634d19313cb8972620d41eb3cfcfc37eeb5571`
12. `nextlevelbuilder/ui-ux-pro-max`: `2de1134dc4d1cfe112934611ae5803ae17a1bd7e`
13. `anthropics/skills`: `3a6501a4db9553648fa3982463e9f4a5ec40d996`
14. `vercel/agent-skills`: `a61bf46fcb4f3b7933f7ee062d0577be1fa6370f`
15. `greensock/gsap-skills`: `631ff72cb20583b4ae9d8e59ec6fb402b1735ffc`
16. `trailofbits/skills`: `ec3930b58e775f0a0c644be5498877e8006e23ea`
17. `supabase/agent-skills`: `4575dca2e57fa12bf1b55979ebfead1104e760ec`
18. `andycungkrinx91/konoha`: `1c2c6559dc256f9f83f9d280126474b7cb25f85b`
19. `alchaincyf/huashu-design`: `1dbd430eeeb9ce29c546b5a3eb64f51e06fa9997`
20. `makecindy/cindy`: `a0f50a3ce0eea0b841254469bbacb6b20c7b3ed9`
21. `Aniekanetim/orca-agent`: `9e9e1bbcb3e64f7cf49c407c570f7223ee185936`

Exact verified coverage: 21/21 pinned Git commits verified in Git object database.
