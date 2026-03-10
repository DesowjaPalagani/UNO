# UNO Game Platform Backend

This is the backend for the UNO game platform, built using Node.js and TypeScript. The backend handles game logic, player management, and real-time communication through WebSockets.

## Project Structure

- **src/**: Contains the source code for the backend.
  - **controllers/**: Contains controllers for handling requests related to games and players.
    - `gameController.ts`: Manages game-related requests.
    - `playerController.ts`: Manages player-related requests.
  - **services/**: Contains services that encapsulate business logic.
    - `gameService.ts`: Contains logic for managing game state and rules.
    - `socketService.ts`: Manages WebSocket connections and events.
  - **routes/**: Contains route definitions for the application.
    - `gameRoutes.ts`: Sets up routes for game actions.
    - `playerRoutes.ts`: Sets up routes for player actions.
  - **types/**: Contains TypeScript interfaces and types used throughout the backend.
    - `index.ts`: Exports interfaces for Player and Game.
  - **utils/**: Contains utility functions for game logic.
    - `gameLogic.ts`: Functions for shuffling cards and determining valid moves.
  - `server.ts`: The entry point for the backend application, setting up the Express server and middleware.

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd uno-game-platform/backend
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the server**:
   ```
   npm start
   ```

## Features

- Real-time multiplayer gameplay using WebSockets.
- Player management including joining and creating games.
- Game state management with rules for UNO.

## License

This project is licensed under the MIT License. See the LICENSE file for details.