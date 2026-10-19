# a2a-schemas

> Machine-checkable permission boundaries and session handoffs for two AI agents that split security work between them.

[![CI](https://github.com/lobsterscollide/a2a-schemas/actions/workflows/ci.yml/badge.svg)](https://github.com/lobsterscollide/a2a-schemas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## The idea

Don't let one agent both write privileged changes and run them. Split the job, and make the split
explicit and checkable instead of leaving it in prompts:

- **Claude Code builds** — it may add new hardening actions to [hardened-api](https://github.com/lobsterscollide/hardened-api).
- **[Loa](https://github.com/0xHoneyJar/loa) applies** — it may dry-run and apply registered actions through the API.
- A third agent is jailed to a single data directory.

Each permission says who it is reported to and when it is revoked. At the end of a session, one
agent leaves the other a structured handoff: what was done, what's waiting for whom, and which
permissions were in force.

## What's inside

| Path | What it is |
|------|------------|
| `boundaries/` | One permission boundary per capability: scope, condition, reporting, revocation |
| `schemas/cc-loa-handoff.schema.json` | JSON Schema (2020-12) for a session handoff |
| `handoffs/example.handoff.json` | An illustrative handoff |
| `validate.js` | Validates every boundary and handoff |

## Quick start

```sh
npm ci --ignore-scripts
npm test
```

## How it works

A boundary (format: the `permission-boundary` schema from
[loa-hounfour](https://github.com/0xHoneyJar/loa-hounfour) v8.3.1):

```json
{
  "scope": "hardened-api:harden:apply",
  "permitted_if": "request.header['X-Harden-Confirm'] == 'yes' AND request.body.actions ALL_IN hardened-api.registered_action_ids AND request.auth == 'Bearer ' + env.HARDENED_API_HARDEN_KEY",
  "reporting":  { "required": true, "report_to": "hardened-api:audit-log", "frequency": "per_action" },
  "revocation": { "trigger": "violation_count", "violation_threshold": 3 }
}
```

A handoff lists `completed`, `pending_for_recipient`, `pending_for_sender`, a `system_state`
snapshot (Lynis score, overall check severity) and the `active_boundary_ids` in force.

`validate.js` checks that boundaries carry every field the hounfour schema requires, and validates
handoffs against the handoff schema with Ajv.

## Requirements

- Node.js (LTS)
- Network access to GitHub for the `loa-hounfour` dependency

## Security notes

- Boundaries describe policy; nothing here enforces it. Enforcement lives in the services and
  agents that read them (e.g. hardened-api's separate apply key and confirm header).
- Install with `--ignore-scripts`; the validator needs no install-time scripts.
- Real handoffs describe a live system's weaknesses. Keep them out of public repos — only the
  example is published here.

## Status

Complete and shared as a reference; not actively maintained.

## Part of a set

| Project | What it is |
|---------|------------|
| [railed](https://github.com/lobsterscollide/railed) | Operating discipline for AI agents with real tool access, built from documented failures |
| [hardened-api](https://github.com/lobsterscollide/hardened-api) | Linux hardening checks and fixes as an API an agent can drive |
| [usb-triage](https://github.com/lobsterscollide/usb-triage) | Run-from-USB security audit for Linux, macOS and Windows |
| [workstation-scripts](https://github.com/lobsterscollide/workstation-scripts) | Daily → quarterly security routine for an Arch workstation |
| **a2a-schemas** | Permission boundaries and handoffs between a "build" agent and an "apply" agent |

## License

[MIT](LICENSE)
