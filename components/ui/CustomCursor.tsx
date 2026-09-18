'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-50 hidden lg:block"
      style={{
        left: position.x - 8,
        top: position.y - 8,
      }}
    >
      <div className="h-4 w-4 rounded-full bg-[var(--accent)] opacity-60" />
    </div>
  );
}
