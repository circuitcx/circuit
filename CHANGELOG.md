# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-06-07

Initial open-source release.

### Added
- `circuit` Claude skill (`/circuit`) — scans Gmail for active two-way
  conversations and prints a classified table with deadlines and action items.
  Works with the Circuit MCP server or any Gmail connector.
- `circuitcx` MCP server — deterministic, LLM-free Gmail engine exposing
  `circuit_scan_active_conversations` and `circuit_get_profile`, with one-time
  loopback OAuth (`circuitcx auth`) and a local read-only token cache.
- Docs: quickstart, connect-gmail (connector + self-host paths), install
  guides, how-it-works, FAQ.
- Example client configs and sample output.
