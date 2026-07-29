"use client";

import { useEffect, useRef } from "react";

/**
 * 逍遥游 — 水墨动画背景
 * 在逍遥游篇章渲染水墨粒子效果（鲲鹏、云烟）
 */
export default function InkWashEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; life: number; maxLife: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn ink particles
    const spawnParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.2 + Math.random() * 0.5),
        size: 60 + Math.random() * 120,
        opacity: 0.06 + Math.random() * 0.10,
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    };

    // Spawn fewer particles for subtlety
    const spawnInterval = setInterval(() => {
      if (particles.length < 15) spawnParticle();
    }, 1500);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const fade = progress < 0.15
          ? progress / 0.15
          : progress > 0.6
            ? (1 - progress) / 0.4
            : 1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(60, 40, 20, ${p.opacity * fade * 0.8})`);
        gradient.addColorStop(0.2, `rgba(60, 40, 20, ${p.opacity * fade * 0.35})`);
        gradient.addColorStop(0.5, `rgba(60, 40, 20, ${p.opacity * fade * 0.12})`);
        gradient.addColorStop(1, "rgba(60, 40, 20, 0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    // Initial burst
    for (let i = 0; i < 5; i++) spawnParticle();

    animate();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(spawnInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}
