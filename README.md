# SMG-C (Social Media Generator - Claude PRD Version)

A cross-platform desktop application built with Tauri and React for generating and managing social media content using Claude-generated Product Requirements Document (PRD).

## Features

- AI-powered content generation
- Multi-platform social media management
- Content scheduling and tracking
- Cross-platform support (Windows, macOS, Linux)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows)
- [Supabase Account](https://supabase.com) (for database)

Here is the link to the changes in Supabase on May 1.  https://github.com/orgs/supabase/discussions/29260

## Development Setup

1. Clone the repository:
   ```powershell
   git clone https://github.com/EffectiveAgileDev/SMG_C.git
   cd SMG_C
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase project URL and anon key from your Supabase project settings

4. Start the development server:
   ```powershell
   npm run tauri dev
   ```

## Project Structure

```
smg-c/
├── src/                    # React source files
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   ├── styles/            # CSS/styling files
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── src-tauri/             # Rust/Tauri backend code
├── public/                # Static assets
└── tests/                 # Test files
```

## Available Scripts

- `npm run tauri dev` - Start the development server
- `npm run build` - Build the production application
- `npm run test` - Run tests
- `npm run lint` - Run linting

## Project Documentation

The following files contain the project's planning documentation (read-only):
- [Project Planning & Architecture](PLANNING-P.md) - Technical architecture and planning details
- [Project Requirements](REQUIREMENTS-P.md) - Detailed project requirements and specifications
- [Project Tasks & Progress](TASK-P.md) - Task tracking and project progress

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Feat(component): add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 