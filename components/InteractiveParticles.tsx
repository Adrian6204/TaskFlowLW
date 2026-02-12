import React, { useEffect, useRef } from 'react';

const InteractiveParticles: React.FC = React.memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: 0, y: 0, radius: 150 };

        const getThemeColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            return {
                accent1: '#CEFD4A', // Core Neon Lime
                accent2: '#A3E635', // Secondary Lime for variety
                main: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.6)'
            };
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        // Theme change observer
        const observer = new MutationObserver(() => {
            init();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            density: number;
            color: string;

            constructor(x: number, y: number) {
                const colors = getThemeColors();
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 1.2;
                this.vy = (Math.random() - 0.5) * 1.2;
                this.size = Math.random() * 2 + 0.5;
                this.density = (Math.random() * 20) + 1;

                // 30% chance for green particles, mixed between two shades
                const rand = Math.random();
                if (rand > 0.7) {
                    this.color = Math.random() > 0.5 ? colors.accent1 : colors.accent2;
                } else {
                    this.color = colors.main;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update(width: number, height: number) {
                this.x += this.vx;
                this.y += this.vy;

                // Mouse interaction (Repel)
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = (dx / (distance || 1)) * force * this.density;
                    const directionY = (dy / (distance || 1)) * force * this.density;

                    this.x -= directionX * 0.5;
                    this.y -= directionY * 0.5;
                }

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }
        }

        const init = () => {
            particles = [];
            const width = canvas.width;
            const height = canvas.height;
            const numberOfParticles = (width * height) / 8000;
            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                particles.push(new Particle(x, y));
            }
        };

        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
                particles[i].update(width, height);
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ filter: 'blur(0.5px)', transform: 'translateZ(0)' }}
        />
    );
});

export default InteractiveParticles;
