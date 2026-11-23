# Security, privacy & safety baseline

Calibrate per domain and risk; use OWASP ASVS 5.0.0 for applicable web apps and NIST SSDF 1.1 as process references, without asserting compliance.

- Identify actors, trust boundaries, assets, sensitive data, malicious inputs, third-party providers, abuse cases and regulatory exposure before choosing controls.
- Define server-side and storage-level authorization, least privilege, tenant isolation, account recovery, audit events, safe defaults and privileged change approvals.
- Describe data collection purpose, lawful basis when applicable, consent, minimization, retention, deletion, export, backup scope, incident responsibilities and test fixtures.
- Never log secrets, personal tokens or raw sensitive payloads. Use environment-variable names as placeholders only; actual secret values live outside repository.
- Model input validation, parameterization, injection, SSRF, file-upload handling, dependency risk, cryptography, replay/idempotency, rate limits, auth session expiry, CSRF where applicable.
- For AI tools: treat retrieved/user text as untrusted; prevent prompt-injection into tool permission context; control tool-call side effects; keep data provenance and redaction.
- For game/embedded/physical systems, consider multiplayer trust, cheating/abuse, device firmware update integrity, hardware hazards and real-world consequences.
- Review threats after architecture changes; map each material threat to mitigation and a verification method. Unknown controls are not “secure.”
