import { useEffect, useState } from 'react';
import { GameState, Player } from '../types';

const useGameState = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);

    useEffect(() => {
        // Logic to fetch initial game state and set up listeners for game updates
        const fetchGameState = async () => {
            // Fetch game state from the server
            // setGameState(response.data);
        };

        fetchGameState();

        // Example of setting up a WebSocket connection to listen for game updates
        const socket = new WebSocket('ws://localhost:3000'); // Update with your server URL

        socket.onmessage = (event) => {
            const updatedState: GameState = JSON.parse(event.data);
            setGameState(updatedState);
            setPlayers(updatedState.players);
            setCurrentPlayerIndex(updatedState.currentPlayerIndex);
            setIsGameActive(updatedState.status === 'IN_PROGRESS');
        };

        return () => {
            socket.close();
        };
    }, []);

    return { gameState, players, currentPlayerIndex, isGameActive };
};

export default useGameState;