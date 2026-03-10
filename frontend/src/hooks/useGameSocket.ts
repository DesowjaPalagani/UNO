import { useEffect, useRef } from 'react';

const useGameSocket = (url: string) => {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        socketRef.current = new WebSocket(url);

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Handle incoming messages
            console.log('Message from server:', data);
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socketRef.current?.close();
        };
    }, [url]);

    const sendMessage = (message: any) => {
        if (socketRef.current) {
            socketRef.current.send(JSON.stringify(message));
        }
    };

    return { sendMessage };
};

export default useGameSocket;