# SMG-C (Student Math Game - C Version)

A cross-platform desktop application built with Tauri and React for helping middle school students learn mathematics through interactive games.

## Features

- Interactive math games
- Progress tracking
- Student-friendly interface
- Cross-platform support (Windows, macOS, Linux)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows)

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

3. Start the development server:
   ```powershell
   npm run tauri dev
   ```

## Project Structure

```
smg-c/
├── src/                    # React source files
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── styles/            # CSS/styling files
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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Feat(component): add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.