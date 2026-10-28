# AI Spy — Live Pixel Office for Your AI Agent Team

AI Spy is a desktop app that turns your AI coding agents into a living, pixel-art office.
Each agent gets a desk, a role, and a state (idle, thinking, working, on a break), and moves
around the office in real time as it works.

Add agents and wire each one to **Claude Code**, the **Anthropic API**, **OpenAI (ChatGPT)**,
**Google Gemini**, or any **OpenAI-compatible endpoint** (OpenRouter, Groq, Ollama, LM Studio).
The simplest setup: paste an API key, type the model name, give the agent a role — done.

## Features

- **Live pixel office** — animated agents that walk between desks, the meeting room, and the lounge
- **Bring your own model** — Claude Code CLI, Anthropic, OpenAI, Gemini, or any OpenAI-compatible base URL
- **Simple agent setup** — pick a provider, paste an API key, type a model name, assign a role
- **Roles** — project manager, engineer, designer, QA, product owner, DevOps, data, security, tech writer, custom
- **Mission control panels** — agent roster, task board, and a live activity feed
- **Projects** — point agents at any local folder and track tasks per project
- **Telemetry** — agents stream events back over a local WebSocket and IPC channel

## Requirements

- Node.js 18+
- An API key for whichever provider you use (or the `claude` CLI for Claude Code)

## Getting started

```bash
npm install
npm run dev      # Vite renderer + Electron main process with hot reload
```

Production build:

```bash
npm run build    # builds dist/renderer, dist/main, dist/preload
npm start
```

Type check:

```bash
npm run typecheck
```

## Adding an agent

1. Open the sidebar and choose an agent (or add one).
2. Open **AI Provider → Configure**.
3. Pick a provider:
   - **Claude Code** — no key needed; uses your local `claude` CLI.
   - **Anthropic / OpenAI / Gemini** — paste your API key and the model name.
   - **Custom** — any OpenAI-compatible endpoint; set the base URL as well.
4. Save. The agent now runs with that provider, model, and role.

Keys are stored in your local user data folder (`config.json`) and are only ever sent to the
provider you chose. They are never committed to this repository.

## Project layout

```
src/
  main/       Electron main process: window, IPC, agent orchestration, telemetry server
  preload/    Secure contextBridge API exposed to the renderer
  renderer/   React UI: pixel office, agent list, task board, activity feed, settings
  shared/     Types shared between main and renderer
```

## License

MIT
