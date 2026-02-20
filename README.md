# Multi-Player Pong Game

A real-time multiplayer Pong game built with TypeScript, WebSockets, and QR code scanning for mobile controllers.

# Demo

Just scan qr code on two devices and play on https://ws-pong.mateuszspychaj.pl/ 🚀

[![CI – Build & Deploy ws-pong](https://github.com/mateusz-spychaj/ws-pong/actions/workflows/main.yml/badge.svg)](https://github.com/mateusz-spychaj/ws-pong/actions/workflows/main.yml)

## Features

- 🎮 Two-player gameplay with mobile controllers
- 🤖 Single-player mode vs AI opponent
- 📱 QR code scanning to join the game
- 🔄 Real-time WebSocket communication
- 🎯 TypeScript for type safety
- 🧪 Unit tests included

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: React 19, TypeScript, Canvas API, Tailwind CSS v4
- **Build**: Vite, esbuild
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

Build for production:

```bash
npm run build
```

The build process:

- Bundles frontend with Vite (React, TypeScript, CSS)
- Bundles server with esbuild to `dist/server.cjs`
- Outputs frontend assets to `dist/public/`

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
2. Open the displayed URL on your computer (e.g., `http://192.168.1.100:5173`)
3. Scan the QR code with your mobile device
4. Player 1 can choose:
   - **Play vs PC** - Play against an AI opponent
   - **Wait for Player** - Wait for a second player to scan the QR code
5. Each player controls their paddle using the ◀/▶ buttons
6. First player controls the top paddle, second player (or AI) controls the bottom paddle
7. Score points by getting the ball past your opponent's paddle

## Project Structure

```
├── src/
│   ├── server.ts              # WebSocket server
│   ├── main.tsx               # Game page entry point
│   ├── controller-main.tsx    # Controller page entry point
│   ├── index.css              # Global styles (Tailwind v4)
│   ├── index.html             # Game screen HTML
│   ├── controller.html        # Mobile controller HTML
│   ├── components/            # React components
│   │   ├── Button.tsx         # Reusable button component
│   │   ├── GameCanvas.tsx     # Canvas wrapper component
│   │   ├── QRCode.tsx         # QR code display component
│   │   ├── ScoreBoard.tsx     # Score display component
│   │   └── VictoryModal.tsx   # Victory modal component
│   ├── gameCore/              # Game logic (framework-agnostic)
│   │   ├── ai.ts              # AI opponent logic
│   │   ├── constants.ts       # Game constants
│   │   ├── drawing.ts         # Canvas drawing functions
│   │   ├── logic.ts           # Core game logic
│   │   ├── types.ts           # TypeScript interfaces
│   │   └── index.ts           # Public exports
│   ├── hooks/                 # React hooks
│   │   ├── useGameLoop.ts     # Game loop management
│   │   ├── useGameState.ts    # Game state management
│   │   ├── useWebSocket.ts    # WebSocket connection
│   │   └── index.ts           # Public exports
│   ├── network/               # Networking layer
│   │   ├── messages.ts        # Message parsing utilities
│   │   ├── types.ts           # Network message types
│   │   ├── websocket.ts       # WebSocket client wrapper
│   │   └── index.ts           # Public exports
│   └── pages/                 # Page components
│       ├── Game.tsx           # Main game display page
│       ├── Controller.tsx     # Mobile controller page
│       └── index.ts           # Public exports
├── tests/
│   ├── gameLogic.test.ts      # Game logic tests
│   └── server.test.ts         # Server logic tests
├── postcss.config.js          # PostCSS configuration
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
└── dist/                      # Production build output (gitignored)
```

## License

MIT
