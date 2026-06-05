import React, { useEffect, useState, useRef } from 'react';
import { MarkGithubIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';

const COLORS = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#1f2328', '#57606a'];

export function OctoArena() {
  const repos = useAppStore(state => state.repos);
  const [cats, setCats] = useState([]);
  const requestRef = useRef();

  // Initialize cats when repos change
  useEffect(() => {
    setCats(repos.map((repo, idx) => ({
      id: repo,
      color: COLORS[idx % COLORS.length],
      x: Math.random() * 80 + 10, // percentage 10-90
      vx: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.1 + 0.05), // velocity
      state: 'walking', // 'walking' | 'fighting'
      fightTimer: 0
    })));
  }, [repos]);

  // Physics loop
  useEffect(() => {
    if (cats.length === 0) return;

    let lastTime = performance.now();

    const animate = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setCats(prevCats => {
        let newCats = [...prevCats];

        // Move cats
        for (let i = 0; i < newCats.length; i++) {
          let c = newCats[i];
          
          if (c.state === 'fighting') {
            c.fightTimer -= deltaTime;
            if (c.fightTimer <= 0) {
              c.state = 'walking';
              // bounce apart
              c.vx = c.vx * -1;
            }
          } else {
            c.x += c.vx * (deltaTime / 16); // normalize speed to 60fps
            
            // Wall bounce
            if (c.x <= 0) {
              c.x = 0;
              c.vx = Math.abs(c.vx);
            } else if (c.x >= 95) { // 95% to keep it on screen
              c.x = 95;
              c.vx = -Math.abs(c.vx);
            }
          }
        }

        // Check collisions (very naive O(N^2) but N is small)
        for (let i = 0; i < newCats.length; i++) {
          for (let j = i + 1; j < newCats.length; j++) {
            let c1 = newCats[i];
            let c2 = newCats[j];
            if (c1.state === 'walking' && c2.state === 'walking') {
              if (Math.abs(c1.x - c2.x) < 3) { // 3% distance threshold
                // Collision!
                c1.state = 'fighting';
                c2.state = 'fighting';
                c1.fightTimer = 1000; // 1 second fight
                c2.fightTimer = 1000;
              }
            }
          }
        }

        return newCats;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [cats.length]);

  if (cats.length === 0) return null;

  return (
    <div className="relative w-full h-8 max-w-6xl mx-auto pointer-events-none">
      {cats.map(cat => (
        <div 
          key={cat.id}
          className={`absolute bottom-0 transition-transform duration-75 ${cat.state === 'fighting' ? 'animate-clash' : ''}`}
          style={{
            left: `${cat.x}%`,
            color: cat.color,
            transform: cat.vx > 0 ? 'scaleX(-1)' : 'scaleX(1)'
          }}
        >
          <MarkGithubIcon size={24} />
          {cat.state === 'fighting' && (
            <span className="absolute -top-4 -right-2 text-xs animate-ping">✨</span>
          )}
        </div>
      ))}
    </div>
  );
}
