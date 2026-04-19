# ⚡ commitlog — AI Changelog Generator

[![npm](https://img.shields.io/npm/v/@ahmad_technology/commitlog-ai)](https://www.npmjs.com/package/@ahmad_technology/commitlog-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> Generate beautiful, human-readable CHANGELOG.md from your git commit history using AI — directly from your terminal.

---

## ✨ Features

- **🤖 Multi-provider AI** — OpenAI, Anthropic, Google Gemini, Groq, NVIDIA NIM, OpenRouter, Ollama
- **📝 Automatic Parsing** — Smartly groups raw `git log` output by conventional types (feat, fix, chore, docs, breaking changes, etc.)
- **🎨 Multiple output formats** — KeepAChangelog (default), simple, detailed, or GitHub-release styles
- **✏️ Interactive flow** — Preview, edit, regenerate, prepend directly into existing files, or safely cancel
- **🌍 Multi-language** — Generate the changelog prose natively in any language
- **⚡ Works offline** — Local Ollama support to generate changelogs securely offline
- **🖥️ Cross-platform** — Distributed via single binaries for Windows, macOS, and Linux
- **🧠 Zero-Config fallback** — Works natively without AI keys via the `--no-ai` fallback formatter

---

## 📦 Installation

```bash
# npm (recommended)
npm install -g @ahmad_technology/commitlog-ai

# Or run directly without installation
npx @ahmad_technology/commitlog-ai
```

---

## 🚀 Quick Start

```bash
# 1. Setup API Keys (first time only)
commitlog setup

# 2. Run automatic generation! (Scans from latest tag to HEAD)
commitlog
```

**What you'll see:**

```
⠋ Reading 23 commits between v1.2.0 and v1.3.0...
⠋ Grouping by type...
⠋ Generating changelog with claude-3-5-sonnet...

✨ Generated changelog:

────────────────────────────────────
## [1.3.0] - 2026-04-19

### Added
- OAuth2 login with Google provider
...
────────────────────────────────────

  [ Prepend to CHANGELOG.md ]  [ Edit ]  [ Regenerate ] [ Copy ]  [ Cancel ]

> Prepend to CHANGELOG.md

✅ CHANGELOG.md updated successfully
```

---

## 🔧 Usage

```bash
commitlog                         # Auto-detect latest tag to HEAD
commitlog v1.2.0 v1.3.0            # Between two specific tags
commitlog abc123 def456            # Between two commit SHAs
commitlog --since "2 weeks ago"    # Time-based range
commitlog --provider anthropic     # Override AI provider
commitlog --model gemini-1.5-pro   # Override AI model
commitlog --format github-release  # GitHub release notes style
commitlog --lang fr                # Output changelog in French
commitlog --dry-run                # Print result, don't write file
commitlog --no-ai                  # Just group/format, no AI polish
commitlog setup                    # Interactive first-time config wizard
commitlog config list              # Display configuration
```

---

## ⚙️ Configuration

Config is successfully managed inside `~/.commitlog/config.toml`:

```toml
[defaults]
provider = "openai"
model = "gpt-4o"
format = "keepachangelog"
output = "CHANGELOG.md"
language = "en"
max_commits = 500

[openai]
api_key = "sk-..."

[anthropic]
api_key = "sk-ant-..."

[gemini]
api_key = "AIza..."

[groq]
api_key = "gsk_..."

[openrouter]
api_key = "sk-or-..."

[nim]
api_key = "nvapi-..."
base_url = "https://integrate.api.nvidia.com/v1"

[ollama]
base_url = "http://localhost:11434"
model = "llama3"
```

---

## 🤖 Supported Providers

| Provider | Config Key | Notes |
|---|---|---|
| **OpenAI** | `openai.api_key` | GPT-4o, GPT-4-turbo |
| **Anthropic** | `anthropic.api_key` | Claude 3.5 Sonnet+ |
| **Google Gemini** | `gemini.api_key` | Gemini 1.5 Pro+ |
| **Groq** | `groq.api_key` | Llama 3, ultra-fast generation |
| **NVIDIA NIM** | `nim.api_key` | OpenAI-compatible endpoints |
| **OpenRouter** | `openrouter.api_key` | 100+ multi-LLM router |
| **Ollama** | None | Fully secure isolated offline |

---

## 🛠️ Development

```bash
# Clone & install
git clone https://github.com/AhmadTchnology/CommitLog-AI.git
cd CommitLog-AI
npm install

# Run in dev mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

---

## 📄 License

MIT © [AhmadTchnology](https://github.com/AhmadTchnology)

##

### Made With ❤️ By AhmadTchnology
