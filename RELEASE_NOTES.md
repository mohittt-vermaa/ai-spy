# AI Spy v1.0.0

## 🎉 Initial Release

Welcome to **AI Spy** - a real-time AI Agent Mission Control Dashboard for managing your AI agent team!

### ✨ Features

- **Multi-Provider Support**: Connect to Claude Code, ChatGPT, Gemini, and custom API endpoints
- **Real-time Agent Monitoring**: Visual office view with agent avatars, status indicators, and activity feeds
- **Task Board**: Kanban-style task management with drag-and-drop
- **Agent Configuration**: Add agents with roles, API keys, and model selections
- **Telemetry Dashboard**: Live metrics and performance monitoring
- **Cross-Platform**: Windows, macOS, Linux, Android, and iOS support

### 📦 Downloads

| Platform | Files |
|----------|-------|
| **Windows** | `.exe` (NSIS installer + portable) |
| **macOS** | `.dmg` (x64 + arm64), `.zip` |
| **Linux** | `.AppImage`, `.deb` |
| **Android** | `.apk` (debug) |
| **iOS** | `.ipa` (ad-hoc) |

### 🚀 Getting Started

1. Download the appropriate installer for your platform
2. Install and launch AI Spy
3. Add your AI agents via the sidebar:
   - **Claude Code**: OAuth or API key
   - **ChatGPT**: API key
   - **Gemini**: API key
   - **Custom**: Any OpenAI-compatible endpoint
4. Assign roles and start your mission!

### 📝 Notes

- **Android**: Debug APK included. For production releases, configure signing keys in GitHub Secrets
- **macOS**: Unsigned builds will show "unidentified developer" warning. Right-click → Open to bypass
- **iOS**: Ad-hoc builds require device UDID registration in Apple Developer portal

### 🔧 Configuration

Set up your API keys in the app's settings panel. All credentials are stored locally and encrypted.

---

**Full Changelog**: https://github.com/mohittt-vermaa/ai-spy/commits/v1.0.0