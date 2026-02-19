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
    aiEnabled: boolean;
    aiMissCounter: number;
    aiMissThreshold: number;
    winner: 'player1' | 'player2' | null;
}

const WINNING_SCORE = 11;

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const animationRef = useRef<number | null>(null);
    const gameRef = useRef<GameState>({
        ball: { x: 400, y: 300, dx: 3, dy: 3, radius: 8 },
        paddle1: { x: 350, y: 20, width: 100, height: 15, dy: 0 },
        paddle2: { x: 350, y: 565, width: 100, height: 15, dy: 0 },
        score: { player1: 0, player2: 0 },
        running: false,
        ballStarted: false,
        aiEnabled: false,
        aiMissCounter: 0,
        aiMissThreshold: Math.floor(Math.random() * 3) + 3,
        winner: null,
    });

    const [qrCode, setQrCode] = useState<string>('');
    const [status, setStatus] = useState('Waiting for players...');
    const [showQr, setShowQr] = useState(true);
    const [showScore, setShowScore] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);
    const [score, setScore] = useState({ player1: 0, player2: 0 });
    const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);

    const resetBall = () => {
        const game = gameRef.current;
        game.ball.x = 400;
        game.ball.y = 300;
        game.ball.dx = 0;
        game.ball.dy = 0;
        game.ballStarted = false;
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
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#ff4444'; // Red for player1
        ctx.fillRect(game.paddle1.x, game.paddle1.y, game.paddle1.width, game.paddle1.height);

        ctx.fillStyle = '#4444ff'; // Blue for player2
        ctx.fillRect(game.paddle2.x, game.paddle2.y, game.paddle2.width, game.paddle2.height);

        // Ball
        ctx.fillStyle = '#ffffff'; // White ball
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
        ctx.fill();
    };

    const gameLoop = () => {
        const game = gameRef.current;
        const canvas = canvasRef.current;
        if (!game.running || !canvas) return;

        // AI for player2
        if (game.aiEnabled) {
            game.aiMissCounter++;

            if (game.aiMissCounter >= game.aiMissThreshold) {
                game.paddle2.dy = 0;
                if (game.ball.y > canvas.height / 2) {
                    game.aiMissCounter = 0;
                    game.aiMissThreshold = Math.floor(Math.random() * 3) + 3;
                }
            } else {
                const diff = game.ball.x - (game.paddle2.x + game.paddle2.width / 2);
                game.paddle2.dy = Math.abs(diff) > 10 ? (diff > 0 ? 6 : -6) : 0;
            }

            if (!game.ballStarted && game.ball.dy < 0 && game.ball.dx !== 0) {
                game.ballStarted = true;
            }
        }

        // Paddle movement
        game.paddle1.x += game.paddle1.dy;
        game.paddle2.x += game.paddle2.dy;

        // Paddle boundaries
        game.paddle1.x = Math.max(0, Math.min(canvas.width - game.paddle1.width, game.paddle1.x));
        game.paddle2.x = Math.max(0, Math.min(canvas.width - game.paddle2.width, game.paddle2.x));

        // Ball movement - only if started
        if (game.ballStarted) {
            game.ball.x += game.ball.dx;
            game.ball.y += game.ball.dy;
        }

        // Bounce off left/right walls
        if (game.ball.x - game.ball.radius < 0 || game.ball.x + game.ball.radius > canvas.width) {
            game.ball.dx *= -1;
        }

        // Paddle collision
        if (
            game.ball.y - game.ball.radius < game.paddle1.y + game.paddle1.height &&
            game.ball.x > game.paddle1.x &&
            game.ball.x < game.paddle1.x + game.paddle1.width
        ) {
            game.ball.dy = Math.abs(game.ball.dy);
            game.ball.dy *= 1.01;
            game.ball.dx *= 1.01;
        }

        if (
            game.ball.y + game.ball.radius > game.paddle2.y &&
            game.ball.x > game.paddle2.x &&
            game.ball.x < game.paddle2.x + game.paddle2.width
        ) {
            game.ball.dy = -Math.abs(game.ball.dy);
            game.ball.dy *= 1.01;
            game.ball.dx *= 1.01;
        }

        // Scoring
        if (game.ball.y < 0) {
            game.score.player2++;
            if (game.score.player2 >= WINNING_SCORE) {
                game.winner = 'player2';
                game.running = false;
            } else {
                resetBall();
                game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
                game.ball.dy = 3;
            }
            setScore({ player1: game.score.player1, player2: game.score.player2 });
        } else if (game.ball.y > canvas.height) {
            game.score.player1++;
            if (game.score.player1 >= WINNING_SCORE) {
                game.winner = 'player1';
                game.running = false;
            } else {
                resetBall();
                game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
                game.ball.dy = -3;
            }
            setScore({ player1: game.score.player1, player2: game.score.player2 });
        }
        draw();

        // Check for winner
        if (game.winner && !winner) {
            setWinner(game.winner);

            // Notify server about game end
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'game_ended', winner: game.winner }));
            }
        }

        animationRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const wsHost = import.meta.env.DEV
            ? backendUrl.replace(/^https?:\/\//, '')
            : window.location.hostname;

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
                setTimeout(gameLoop, 100);
            }

            if (data.type === 'enable_ai') {
                gameRef.current.aiEnabled = true;
            }

            if (data.type === 'player_move') {
                const game = gameRef.current;
                const paddle = data.player === 'player1' ? game.paddle1 : game.paddle2;
                paddle.dy = data.direction === 'left' ? -8 : data.direction === 'right' ? 8 : 0;

                if (!game.ballStarted && data.direction !== 'stop') {
                    const shouldStart = (data.player === 'player2' && game.ball.dy < 0) ||
                        (data.player === 'player1' && game.ball.dy > 0) ||
                        (game.ball.dx === 0 && game.ball.dy === 0);

                    if (shouldStart) {
                        if (game.ball.dx === 0 && game.ball.dy === 0) {
                            game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
                            game.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 3;
                        }
                        game.ballStarted = true;
                    }
                }
            }

            if (data.type === 'player_disconnected') {
                gameRef.current.running = false;
                setStatus('Player disconnected. Game paused.');
            }

            if (data.type === 'all_players_disconnected') {
                gameRef.current.running = false;
                gameRef.current.ballStarted = false;
                gameRef.current.aiEnabled = false;
                gameRef.current.winner = null;
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                setShowCanvas(false);
                setShowScore(false);
                setShowQr(true);
                setWinner(null);
                setStatus('Waiting for players...');
                gameRef.current.score.player1 = 0;
                gameRef.current.score.player2 = 0;
                setScore({ player1: 0, player2: 0 });
                resetBall();
            }

            if (data.type === 'restart_game') {
                gameRef.current.score.player1 = 0;
                gameRef.current.score.player2 = 0;
                gameRef.current.winner = null;
                setScore({ player1: 0, player2: 0 });
                setWinner(null);
                resetBall();
                gameRef.current.running = true;
                gameRef.current.ballStarted = false;

                // Cancel existing animation and start new one
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }
                gameLoop();
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
        <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center font-['Courier_New',monospace] text-white">
            <div className="text-center flex flex-col items-center">
                {!showCanvas && (
                    <h1 className="text-[#00ff88] mb-[20px]" style={{ fontSize: '48px' }}>🏓 WS Pong</h1>
                )}

                {showQr && qrCode && (
                    <div className="my-[20px] mx-auto p-[20px] bg-white rounded-[10px] inline-block">
                        <img src={qrCode} alt="QR Code" className="w-[300px] h-[300px]" />
                    </div>
                )}

                {status && (
                    <div className="text-2xl my-[20px] text-[#00ff88]">{status}</div>
                )}

                {showScore && (
                    <div className="text-[32px] my-[10px]">
                        <span className="text-[#ff4444] font-bold">{score.player1}</span>
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

                {showScore && (
                    <div className="text-[32px] my-[10px]">
                        <span className="text-[#4444ff] font-bold">{score.player2}</span>
                    </div>
                )}

                {winner && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-50">
                        <div className="bg-[#2a2a3e] rounded-[20px] text-center border-4 border-[#00ff88] shadow-2xl" style={{ padding: '64px' }}>
                            <h1 className="text-6xl font-bold text-[#00ff88] mb-8">Victory!</h1>
                            <p className="text-4xl mb-4 text-[#eeeeee]">
                                Player <span className={winner === 'player1' ? 'text-[#ff4444]' : 'text-[#4444ff]'}>
                                    {winner === 'player1' ? 'Red' : 'Blue'}
                                </span> wins!
                            </p>
                            <div className="text-6xl font-bold mt-8">
                                <span className="text-[#ff4444]">{score.player1}</span>
                                <span className="text-white mx-4">-</span>
                                <span className="text-[#4444ff]">{score.player2}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
