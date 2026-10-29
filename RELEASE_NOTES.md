# AI Spy v1.0.0

## 🎉 Initial Release

AI Spy is a real-time AI Agent Mission Control dashboard - a pixel-art office for managing your AI agent team across multiple providers.

### ✨ Features

- **Multi-Provider Support**: Connect to Claude Code, Anthropic, OpenAI, Gemini, or any OpenAI-compatible API
- **Bring Your Own Keys**: Use your own API keys for cloud providers, or local CLI for Claude Code
- **Agent Roles**: Pre-configured roles (Project Manager, Software Engineer, UI/UX Designer, QA Tester, etc.) or custom
- **Real-time Telemetry**: WebSocket-based live activity feed
- **Task Board**: Kanban-style task management with drag-and-drop
- **Pixel Art UI**: Retro terminal aesthetic with modern React

### 📦 Downloads

| Platform | File |
|----------|------|
| Windows (x64) | `AI Spy Setup 1.0.0.exe` |
| Windows (Portable) | `AI Spy 1.0.0.exe` |
| macOS (Intel) | `AI Spy-1.0.0-x64.dmg` |
| macOS (Apple Silicon) | `AI Spy-1.0.0-arm64.dmg` |
| Linux (AppImage) | `AI Spy-1.0.0.AppImage` |
| Linux (Debian) | `ai-spy_1.0.0_amd64.deb` |
| Linux (RPM) | `ai-spy-1.0.0-1.x86_64.rpm` |
| Android | `app-release.apk` |
| iOS | `AI Spy.ipa` |

### 🚀 Getting Started

1. Download the appropriate installer for your platform
2. Install and launch AI Spy
3. Open Settings → Providers to configure your AI providers
4. Go to Agents panel and click "+ Add Agent"
5. Choose a provider, enter your API key, pick a model, and assign a role
6. Start the agent and give it tasks!

### 🔧 Provider Setup

- **Claude Code**: Install `claude` CLI and run `claude login`
- **Anthropic**: Get API key from https://console.anthropic.com
- **OpenAI**: Get API key from https://platform.openai.com
- **Gemini**: Get API key from https://aistudio.google.com
- **Custom**: Any OpenAI-compatible endpoint (Ollama, vLLM, Together AI, etc.)

### ⚠️ Known Limitations

- Mobile builds (Android/iOS) require additional native setup (Capacitor)
- macOS notarization requires Apple Developer account (unsigned builds will show security warning)
- Windows builds require NSIS (included in build)
- Linux AppImage should run on most distributions

### 📝 Full Changelog

This is the first release.