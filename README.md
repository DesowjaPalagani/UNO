# UNO Game Platform

Welcome to the UNO Game Platform! This project is a web-based multiplayer UNO game built using React, Next.js, TypeScript, and Node.js. 

## Project Structure

The project is divided into two main parts: the frontend and the backend.

### Frontend

The frontend is built with Next.js and TypeScript. It includes the following key components:

- **Pages**:
  - `index.tsx`: The main entry point for the application, rendering the home page.
  - `game.tsx`: The game interface, displaying the game board and managing game state.
  - `lobby.tsx`: The lobby interface for players to join or create games.

- **Components**:
  - `GameBoard.tsx`: Displays the current game state, including player positions and the deck.
  - `PlayerHand.tsx`: Shows the cards in a player's hand and allows for card selection.
  - `Card.tsx`: Represents an individual card and its properties.
  - `Chat.tsx`: Enables player communication during the game.

- **Hooks**:
  - `useGameSocket.ts`: Manages the WebSocket connection for real-time game updates.
  - `useGameState.ts`: Manages the game state, including player actions and game status.

- **Types**:
  - `index.ts`: Contains TypeScript interfaces and types used throughout the frontend.

- **Styles**:
  - `globals.css`: Global CSS styles for the application.

### Backend

The backend is built with Node.js and TypeScript, providing the necessary API and game logic. It includes:

- **Server**:
  - `server.ts`: Sets up the Express server and middleware.

- **Controllers**:
  - `gameController.ts`: Handles game-related requests and responses.
  - `playerController.ts`: Manages player-related requests and responses.

- **Services**:
  - `gameService.ts`: Contains business logic for managing game state and rules.
  - `socketService.ts`: Manages WebSocket connections and events.

- **Routes**:
  - `gameRoutes.ts`: Sets up routes related to game actions.
  - `playerRoutes.ts`: Sets up routes related to player actions.

- **Types**:
  - `index.ts`: Contains TypeScript interfaces and types used throughout the backend.

- **Utils**:
  - `gameLogic.ts`: Utility functions for game logic, such as shuffling cards and determining valid moves.

## Getting Started

To get started with the UNO Game Platform, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the frontend and backend directories and install the dependencies:
   ```
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Start the backend server:
   ```
   cd backend
   npm start
   ```

4. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to start playing!

## Features

- Real-time multiplayer gameplay
- User-friendly interface
- Chat functionality for players
- Responsive design

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.