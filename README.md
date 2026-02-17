# Multi-Player Pong Game

A real-time multiplayer Pong game built with TypeScript, WebSockets, and QR code scanning for mobile controllers.

## Features

- 🎮 Two-player gameplay with mobile controllers
- 📱 QR code scanning to join the game
- 🔄 Real-time WebSocket communication
- 🎯 TypeScript for type safety
- 🧪 Unit tests included

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: TypeScript, Canvas API
- **Build**: TypeScript Compiler, tsx
- **Testing**: Node.js test runner

## Installation

```bash
npm install
```

## Development

Run the development server with hot reload:

```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript (development):

```bash
npm run build
```

Build for production (minified):

```bash
npm run build:prod
```

The build process:

- Compiles TypeScript files from `src/` to `dist/src/`
- In production: minifies JS with esbuild and CSS with clean-css
- Outputs final files to `public/` directory
- Copies HTML files to `public/`

## Production

Run the production server:

```bash
npm run prod
```

Or with custom port:

```bash
PORT=8080 npm run prod
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## How to Play

1. Start the server: `npm run dev`
2. Open the displayed URL on your computer (e.g., `http://192.168.1.100:3000`)
3. Scan the QR code with two mobile devices
4. Each player controls their paddle using the ▲/▼ buttons
5. First player controls the left paddle, second player controls the right paddle
6. Score points by getting the ball past your opponent's paddle

## Project Structure

```
├── server.ts              # WebSocket server
├── index.html             # Game screen HTML
├── controller.html        # Mobile controller HTML
├── src/
│   ├── game.ts           # Game logic (TypeScript)
│   ├── controller.ts     # Controller logic (TypeScript)
│   ├── game.css          # Game styles
│   └── controller.css    # Controller styles
├── tests/
│   ├── game.test.ts      # Game logic tests
│   └── server.test.ts    # Server logic tests
├── build.ts              # Build script
├── tsconfig.json         # TypeScript config
├── dist/                 # Compiled TypeScript (gitignored)
└── public/               # Production build output (gitignored)
    ├── index.html
    ├── controller.html
    ├── game.js           # Minified in production
    ├── controller.js     # Minified in production
    ├── game.css          # Minified in production
    └── controller.css    # Minified in production
```

## License

MIT
