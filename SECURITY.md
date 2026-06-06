# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately via [GitHub Security Advisories](https://github.com/circuitcx/circuit/security/advisories/new), or email **security@circuit.cx**. We aim to acknowledge within 72 hours.

When relevant, include: affected component (skill / MCP server), version, reproduction steps, and impact.

## Scope & threat model

The open-source tier is **bring-your-own-credentials** and **local-first**:

- The MCP server runs on the user's machine and talks directly to the Gmail API with a **read-only** scope.
- OAuth tokens are cached locally at `~/.circuit/token.json` (chmod 600). They are never transmitted anywhere except Google's token endpoint.
- No conversation content is sent to any Circuit-operated server in this path.

Areas we especially care about:
- Token handling / accidental token logging.
- Any code path that would broaden the Gmail scope beyond read-only.
- Dependency vulnerabilities in the MCP server.

## Supported versions

The latest published `circuitcx` release and `main` receive security fixes.
