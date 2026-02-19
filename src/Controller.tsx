import { useEffect, useState, useRef } from 'react';
import Button from './components/Button';

export default function Controller() {
    const [status, setStatus] = useState('Connecting...');
    const [showControls, setShowControls] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(false);
    const [playerColor, setPlayerColor] = useState('#00ff88');
    const [playerName, setPlayerName] = useState('');
    const [gameEnded, setGameEnded] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight);

    useEffect(() => {
        const checkOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const wsHost = import.meta.env.DEV
            ? backendUrl.replace(/^https?:\/\//, '')
            : window.location.hostname;

        const ws = new WebSocket(`${wsProtocol}//${wsHost}`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'register_player' }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'assigned') {
                if (data.player === 'player1') {
                    setStatus('You are ');
                    setPlayerName('Red');
                    setPlayerColor('#ff4444'); // Red
                    setShowModeSelection(true);
                } else {
                    setStatus('You are ');
                    setPlayerName('Blue');
                    setPlayerColor('#4444ff'); // Blue
                    setShowControls(true);
                }
            }

            if (data.type === 'error') {
                setStatus(data.message || 'Error occurred');
            }

            if (data.type === 'game_ended') {
                setGameEnded(true);
            }

            if (data.type === 'game_restarted') {
                setGameEnded(false);
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

    const handlePlayVsPC = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'start_vs_ai' }));
        }
        setShowModeSelection(false);
        setShowControls(true);
    };

    const handleWaitForPlayer = () => {
        setShowModeSelection(false);
        setStatus('Waiting for second player...');
    };

    const handlePlayAgain = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'restart_game' }));
        }
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
            <div className="text-2xl my-5 text-indigo-400 text-center">
                {status}
                {playerName && <span style={{ color: playerColor }}>{playerName}</span>}
                {playerName && ' Player'}
            </div>

            {showModeSelection && isLandscape && (
                <div className="flex flex-col gap-6 w-full px-8 items-center h-1/2">
                    <div className="text-2xl text-center text-white mb-2">Choose game mode:</div>
                    <div className="flex gap-4 w-full h-full">
                        <Button
                            onClick={handlePlayVsPC}
                            variant="default"
                            size="lg"
                            className="flex-1 h-full text-3xl font-bold bg-[#00ff88] text-[#1a1a2e] hover:bg-[#00dd77]"
                        >
                            Play vs PC
                        </Button>
                        <Button
                            onClick={handleWaitForPlayer}
                            variant="secondary"
                            size="lg"
                            className="flex-1 h-full text-3xl font-bold bg-[#4a4a6e] text-white hover:bg-[#5a5a7e]"
                        >
                            Wait for Player
                        </Button>
                    </div>
                </div>
            )}

            {showControls && isLandscape && !gameEnded && (
                <div className="flex flex-col flex-grow w-full">
                    <div className="flex flex-grow gap-x-4">
                        <Button
                            onTouchStart={(e) => { e.preventDefault(); sendMove('left'); }}
                            onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                            onMouseDown={() => sendMove('left')}
                            onMouseUp={() => sendMove('stop')}
                            variant="outline"
                            size="lg"
                            className="w-1/2 h-full text-8xl block mx-8"
                            style={{ backgroundColor: playerColor, borderColor: playerColor }}
                        >
                            ◀
                        </Button>

                        <Button
                            onTouchStart={(e) => { e.preventDefault(); sendMove('right'); }}
                            onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                            onMouseDown={() => sendMove('right')}
                            onMouseUp={() => sendMove('stop')}
                            variant="outline"
                            size="lg"
                            className="w-1/2 h-full text-8xl block mx-8"
                            style={{ backgroundColor: playerColor, borderColor: playerColor }}
                        >
                            ▶
                        </Button>
                    </div>

                    <Button
                        onClick={handleExit}
                        variant="destructive"
                        size="lg"
                        className="w-full h-[10vh] text-lg font-bold bg-[#FF0000] hover:bg-[#dd0000]"
                    >
                        EXIT
                    </Button>
                </div>
            )}

            {gameEnded && isLandscape && (
                <div className="flex items-center justify-center flex-grow w-full px-8">
                    <Button
                        onClick={handlePlayAgain}
                        variant="default"
                        size="lg"
                        className="w-full h-full text-6xl font-bold bg-[#00ff88] text-[#1a1a2e] hover:bg-[#00dd77]"
                    >
                        Play Again
                    </Button>
                </div>
            )}
        </div>
    );
}
