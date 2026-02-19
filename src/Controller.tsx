import { useEffect, useState, useRef } from 'react';

export default function Controller() {
    const [status, setStatus] = useState('Connecting...');
    const [showControls, setShowControls] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const [isLandscape, setIsLandscape] = useState(() => {
        return window.innerWidth > window.innerHeight;
    });

    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        // Check on mount
        checkOrientation();

        // Listen to resize events
        window.addEventListener('resize', checkOrientation);

        // Listen to orientationchange event
        window.addEventListener('orientationchange', checkOrientation);

        // Also listen to orientation change
        const mediaQuery = window.matchMedia('(orientation: landscape)');
        const handleOrientationChange = (e: MediaQueryListEvent) => {
            setIsLandscape(e.matches);
        };

        mediaQuery.addEventListener('change', handleOrientationChange);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
            mediaQuery.removeEventListener('change', handleOrientationChange);
        };
    }, []);

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        let wsHost: string;
        if (import.meta.env.DEV) {
            // Development: use VITE_BACKEND_URL
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            wsHost = backendUrl.replace(/^https?:\/\//, '');
        } else {
            // Production: use window.location.hostname without port
            wsHost = window.location.hostname;
        }

        const ws = new WebSocket(`${wsProtocol}//${wsHost}`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'register_player' }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'assigned') {
                setStatus(`You are ${data.player === 'player1' ? 'Player 1 (Top)' : 'Player 2 (Bottom)'}`);
                setShowControls(true);
            }

            if (data.type === 'error') {
                setStatus(data.message || 'Error occurred');
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendMove = (direction: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'move', direction }));
        }
    };

    const handleExit = () => {
        wsRef.current?.close();
        setStatus('Disconnected');
        setShowControls(false);
    };

    return (
        <div
            className="h-[100dvh] bg-[#1a1a2e] flex flex-col items-center justify-center text-[#00ff88] select-none"
            style={{ touchAction: 'none' }}
        >
            {!isLandscape && (
                <div className="top-0 left-0 w-1/2 h-1/2 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-10 p-4">
                    <svg className="w-16 h-16 text-white animate-gentle-rotate mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <p className="text-xl text-white text-center">Please rotate your device to landscape mode</p>
                </div>
            )}
            <div className="text-2xl my-5 text-indigo-400 text-center">{status}</div>

            {showControls && isLandscape && (
                <div className="flex flex-col flex-grow w-full">
                    <div className="flex flex-grow gap-x-4">
                        <button
                            onTouchStart={(e) => { e.preventDefault(); sendMove('left'); }}
                            onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                            onMouseDown={() => sendMove('left')}
                            onMouseUp={() => sendMove('stop')}
                            className="w-1/2 h-full text-8xl bg-[#00ff88] block mx-8 rounded-lg active:scale-95 transition-transform duration-100"
                        >
                            ◀
                        </button>

                        <button
                            onTouchStart={(e) => { e.preventDefault(); sendMove('right'); }}
                            onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                            onMouseDown={() => sendMove('right')}
                            onMouseUp={() => sendMove('stop')}
                            className="w-1/2 h-full text-8xl bg-[#00ff88] block mx-8 rounded-lg active:scale-95 transition-transform duration-100"
                        >
                            ▶
                        </button>
                    </div>

                    <button
                        onClick={handleExit}
                        className="w-full h-[10vh] text-lg bg-[#FF0000] rounded-lg border-none cursor-pointer transition-all duration-200 select-none active:bg-red-700 flex items-center justify-center text-white font-bold p-4"
                    >
                        EXIT
                    </button>
                </div>
            )}
        </div>
    );
}
