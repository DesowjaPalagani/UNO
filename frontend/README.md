# UNO Game Platform - Frontend

Welcome to the UNO Game Platform frontend! This project is built using React, Next.js, TypeScript, and Node.js to create a web-based multiplayer UNO game.

## Project Structure

The frontend is organized as follows:

- **src/pages**: Contains the main pages of the application.
  - `index.tsx`: The home page of the UNO game platform.
  - `game.tsx`: The game interface, rendering the game board and managing game state.
  - `lobby.tsx`: The lobby interface for players to join or create games.

- **src/components**: Contains reusable components for the application.
  - `GameBoard.tsx`: Displays the current game state, including player positions and the deck.
  - `PlayerHand.tsx`: Displays the cards in a player's hand and allows for card selection.
  - `Card.tsx`: Represents an individual card and its properties.
  - `Chat.tsx`: Allows players to communicate during the game.

- **src/hooks**: Contains custom hooks for managing game state and WebSocket connections.
  - `useGameSocket.ts`: Manages the WebSocket connection for real-time game updates.
  - `useGameState.ts`: Manages the game state, including player actions and game status.

- **src/types**: Contains TypeScript interfaces and types used throughout the frontend.
  - `index.ts`: Exports interfaces such as Player, Card, and GameState.

- **src/styles**: Contains global CSS styles for the application.
  - `globals.css`: Global styles for the application.

## Getting Started

To get started with the frontend, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the frontend directory:
   ```
   cd uno-game-platform/frontend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000` to see the application in action.

## Features

- Real-time multiplayer gameplay using WebSocket.
- User-friendly interface for managing games and player interactions.
- Chat functionality for players to communicate during the game.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.