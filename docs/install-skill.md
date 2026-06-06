# Installing the Circuit skill

The skill is the `/circuit` command. It works with either Gmail backend (see [connect-gmail.md](./connect-gmail.md)).

## Claude Code — plugin marketplace (recommended)

```bash
claude plugin marketplace add circuitcx/circuit
claude plugin install circuit@circuit
```

Then run `/circuit` in any session.

## Claude Code / Claude Desktop — manual install

Copy the skill into your personal skills directory:

```bash
git clone https://github.com/circuitcx/circuit.git
mkdir -p ~/.claude/skills
cp -r circuit/skills/circuit ~/.claude/skills/circuit
```

Restart Claude Code (or reload skills). Run `/circuit`.

## Claude Desktop — upload

If your Claude Desktop build supports uploaded skills, zip the skill folder and add it via the skills UI:

```bash
cd circuit/skills && zip -r circuit-skill.zip circuit
```

Upload `circuit-skill.zip`.

## Verify

Type `/circuit`. If neither a Gmail connector nor the Circuit MCP server is available, the skill will tell you what to enable. Otherwise it scans and prints your active conversations.

## Updating

- Marketplace: `claude plugin update circuit@circuit`
- Manual: re-`git pull` and re-copy `skills/circuit` into `~/.claude/skills/circuit`.
