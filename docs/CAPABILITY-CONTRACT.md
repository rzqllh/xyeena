# Capability Contract

Each capability owns a `capability.json` machine contract and a `SKILL.md` model-facing instruction.

The machine contract is Xyeena-specific; it is not a replacement for the Agent Skills standard. Runtime adapters translate portable Xyeena semantics into the primitives each host supports.

Core fields:

- `metadata`: stable name, version, category and description.
- `type`: KNOWLEDGE, PROCESS, TOOL, AGENT, GOVERNOR or GATE.
- `activation`: auto/user/event semantics, intents, signals, paths and eligible workflow states.
- `workflow`: entry state, observable completion criteria and transitions.
- `dependencies`: mandatory/optional capability prerequisites.
- `chain`: capabilities that may be requested when genuinely required by the current completion contract.
- `requirements`: tool and specialist requirements.
- `parallelism`: safe and unsafe parallel work.
- `consent`: minimum operation class.
- `evidence`: proof required before completion.
- `outputs`: structured result categories.
- `budget`: default execution cost and supporting-capability bound.

The registry validates references and rejects capability chain cycles.
