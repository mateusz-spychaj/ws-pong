import { useEffect, useRef, useState } from 'react';

interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
}

interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
}

interface Score {
    player1: number;
    player2: number;
}

interface GameState {
    ball: Ball;
    paddle1: Paddle;
    paddle2: Paddle;
    score: Score;
    running: boolean;
    ballStarted: boolean;
}

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const animationRef = useRef<number | null>(null);
    const gameRef = useRef<GameState>({
        ball: { x: 400, y: 300, dx: 4, dy: 4, radius: 8 },
        paddle1: { x: 20, y: 250, width: 15, height: 100, dy: 0 },
        paddle2: { x: 765, y: 250, width: 15, height: 100, dy: 0 },
        score: { player1: 0, player2: 0 },
        running: false,
        ballStarted: false,
    });

    const [qrCode, setQrCode] = useState<string>('');
    const [status, setStatus] = useState('Waiting for players...');
    const [showQr, setShowQr] = useState(true);
    const [showScore, setShowScore] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);
    const [score, setScore] = useState({ player1: 0, player2: 0 });

    const resetBall = () => {
        const game = gameRef.current;
        game.ball.x = 400;
        game.ball.y = 300;
        game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
        game.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 4;
        game.ballStarted = false;
    };

    const updateScore = () => {
        const game = gameRef.current;
        setScore({ player1: game.score.player1, player2: game.score.player2 });
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const game = gameRef.current;

        ctx.fillStyle = '#0f0f1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center line
        ctx.strokeStyle = '#00ff88';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(game.paddle1.x, game.paddle1.y, game.paddle1.width, game.paddle1.height);
        ctx.fillRect(game.paddle2.x, game.paddle2.y, game.paddle2.width, game.paddle2.height);

        // Ball
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
        ctx.fill();
    };

    const gameLoop = () => {
        const game = gameRef.current;
        const canvas = canvasRef.current;
        if (!game.running || !canvas) return;

        // Paddle movement
        game.paddle1.y += game.paddle1.dy;
        game.paddle2.y += game.paddle2.dy;

        // Paddle boundaries
        game.paddle1.y = Math.max(0, Math.min(canvas.height - game.paddle1.height, game.paddle1.y));
        game.paddle2.y = Math.max(0, Math.min(canvas.height - game.paddle2.height, game.paddle2.y));

        // Ball movement - only if started
        if (game.ballStarted) {
            game.ball.x += game.ball.dx;
            game.ball.y += game.ball.dy;
        }

        // Bounce off top/bottom
        if (game.ball.y - game.ball.radius < 0 || game.ball.y + game.ball.radius > canvas.height) {
            game.ball.dy *= -1;
        }

        // Paddle collision
        if (
            game.ball.x - game.ball.radius < game.paddle1.x + game.paddle1.width &&
            game.ball.y > game.paddle1.y &&
            game.ball.y < game.paddle1.y + game.paddle1.height
        ) {
            game.ball.dx = Math.abs(game.ball.dx);
            game.ball.dx *= 1.05;
        }

        if (
            game.ball.x + game.ball.radius > game.paddle2.x &&
            game.ball.y > game.paddle2.y &&
            game.ball.y < game.paddle2.y + game.paddle2.height
        ) {
            game.ball.dx = -Math.abs(game.ball.dx);
            game.ball.dx *= 1.05;
        }

        // Scoring
        if (game.ball.x < 0) {
            game.score.player2++;
            resetBall();
        }
        if (game.ball.x > canvas.width) {
            game.score.player1++;
            resetBall();
        }

        updateScore();
        draw();
        animationRef.current = requestAnimationFrame(gameLoop);
    };

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
            const origin = window.location.origin;
            ws.send(JSON.stringify({ type: 'register_screen', origin }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'qr_code') {
                setQrCode(data.qrCode);
            }

            if (data.type === 'hide_qr') {
                setShowQr(false);
            }

            if (data.type === 'start_game') {
                setStatus('');
                setShowQr(false);
                setShowScore(true);
                setShowCanvas(true);
                gameRef.current.running = true;
                gameLoop();
            }

            if (data.type === 'player_move') {
                const game = gameRef.current;
                const paddle = data.player === 'player1' ? game.paddle1 : game.paddle2;
                paddle.dy = data.direction === 'up' ? -8 : data.direction === 'down' ? 8 : 0;

                // Start ball on first move
                if (!game.ballStarted && data.direction !== 'stop') {
                    game.ballStarted = true;
                }
            }

            if (data.type === 'player_disconnected') {
                gameRef.current.running = false;
                setStatus('Player disconnected. Game paused.');
            }

            if (data.type === 'all_players_disconnected') {
                gameRef.current.running = false;
                gameRef.current.ballStarted = false;
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                setShowCanvas(false);
                setShowScore(false);
                setShowQr(true);
                setStatus('Waiting for players...');
                gameRef.current.score.player1 = 0;
                gameRef.current.score.player2 = 0;
                setScore({ player1: 0, player2: 0 });
                resetBall();
            }
        };

        return () => {
            ws.close();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center font-['Courier_New',monospace] text-white">
            <div className="text-center">
                <h1 className="text-[#00ff88] mb-[20px]" style={{ fontSize: '48px' }}>🏓 WS Pong</h1>

                {showQr && qrCode && (
                    <div className="my-[20px] mx-auto p-[20px] bg-white rounded-[10px] inline-block">
                        <img src={qrCode} alt="QR Code" className="w-[300px] h-[300px]" />
                    </div>
                )}

                {status && (
                    <div className="text-2xl my-[20px] text-[#00ff88]">{status}</div>
                )}

                {showScore && (
                    <div className="text-[32px] my-[10px] text-[#00ff88]">
                        Player 1: <span>{score.player1}</span> |
                        Player 2: <span>{score.player2}</span>
                    </div>
                )}

                {showCanvas && (
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="border-[3px] border-[#00ff88] bg-[#0f0f1e] my-[20px] mx-auto"
                    />
                )}
            </div>
        </div>
    );
}
