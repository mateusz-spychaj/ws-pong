import { useEffect, useState, useRef } from 'react';

export default function Controller() {
    const [status, setStatus] = useState('Connecting...');
    const [showControls, setShowControls] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

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
                setStatus(`You are ${data.player === 'player1' ? 'Player 1 (Left)' : 'Player 2 (Right)'}`);
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
        <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center font-['Courier_New',monospace] text-white" style={{ touchAction: 'none' }}>
            <div className="text-2xl my-[20px] text-[#00ff88] text-center">{status}</div>

            {showControls && (
                <div className="flex flex-col gap-[20px] mt-[40px]">
                    <button
                        onTouchStart={(e) => { e.preventDefault(); sendMove('up'); }}
                        onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                        onMouseDown={() => sendMove('up')}
                        onMouseUp={() => sendMove('stop')}
                        className="w-[200px] h-[100px] text-[48px] bg-[#00ff88] border-none rounded-[15px] cursor-pointer transition-all duration-100 select-none active:bg-[#00cc6a] active:scale-95"
                    >
                        ▲
                    </button>

                    <button
                        onTouchStart={(e) => { e.preventDefault(); sendMove('down'); }}
                        onTouchEnd={(e) => { e.preventDefault(); sendMove('stop'); }}
                        onMouseDown={() => sendMove('down')}
                        onMouseUp={() => sendMove('stop')}
                        className="w-[200px] h-[100px] text-[48px] bg-[#00ff88] border-none rounded-[15px] cursor-pointer transition-all duration-100 select-none active:bg-[#00cc6a] active:scale-95"
                    >
                        ▼
                    </button>

                    <button
                        onClick={handleExit}
                        className="w-[200px] h-[100px] text-[48px] bg-[#00ff88] border-none rounded-[15px] cursor-pointer transition-all duration-100 select-none active:bg-[#00cc6a] active:scale-95"
                    >
                        EXIT
                    </button>
                </div>
            )}
        </div>
    );
}
