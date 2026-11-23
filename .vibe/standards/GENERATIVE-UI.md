# Generative UI  -  Native V4 Standard

Scope: interactive project discovery and apps that explicitly require dynamic AI-generated interfaces.

## Declarative contract

- AI may propose a versioned UI description (JSON), never HTML/JavaScript to execute. Validate against an allowlisted component catalog and a JSON Schema before rendering.
- Every control must have a semantic role, accessible name, predictable focus order, keyboard behavior, input limits and text-only fallback.
- UI definitions do not grant access to tools. Actions are typed references into a separately verified policy registry. Unknown action IDs are rejected.
- Mutating actions require an explicit approved scope. Default deny. Automatic actions are limited to the user-authorized low-risk scope; external, destructive or privileged effects need an explicit approval gate.
- Preserve data provenance (Confirmed / Inferred / Proposed / Unknown); never label generated suggestions as verified requirements.
- If host lacks a renderer, express choices as numbered text. Do not claim native widget support that was not detected.

## Sample conceptual contract

```json
{
  "version": "1",
  "surface": "project-discovery",
  "kind": "choice",
  "title": "Who is this for?",
  "options": [{"id": "team", "label": "Internal team"}, {"id": "public", "label": "Public users"}],
  "action": {"id": "record-answer", "policy": "local-draft-write"}
}
```

This example is documentation, not a working connector. At runtime validate allowed components/actions, input values, and policy before dispatch.

## Visual validation

Inspect responsive behavior, forced long text, reduced motion, high zoom, keyboard-only operation and screen reader semantics. Do not render fabricated database or architecture links; derive diagrams from source data.

## Optional adapters (not mandatory dependencies)

A2UI for declarative surfaces, AG-UI for agent event transport, json-render for React catalogs, or a host-specific adapter. Confirm version and capabilities before choosing a package. The headless model is the source of truth.
