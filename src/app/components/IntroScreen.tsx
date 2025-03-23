'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface IntroScreenProps {
  onEnter: () => void;
  backgroundImage: string;
}

export default function IntroScreen({ onEnter, backgroundImage }: IntroScreenProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleEnter = () => {
    setLoading(true);
    
    // Start progress animation
    const startTime = Date.now();
    const duration = 2000; // 2 seconds for loading animation
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(nextProgress);
      
      if (nextProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // When progress reaches 100%, trigger the onEnter callback
        setTimeout(() => {
          onEnter();
        }, 200);
      }
    };
    
    requestAnimationFrame(updateProgress);
  };

  return (
    <div 
      className="fixed inset-0 z-50 cursor-pointer"
      onClick={!loading ? handleEnter : undefined}
    >
      {/* Full-screen background image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundImage}
          alt="Intro background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      
      {/* Content overlay - positioned specifically */}
      {loading && (
        <div 
          className="absolute z-10"
          style={{
            // Position calculation:
            // If center of element should be at (840, 830) on a 1920x1080 screen:
            // - For horizontal: 840/1920 = 43.75% from left
            // - For vertical: 830/1080 = 76.85% from top
            // Then adjust by half the element's width/height to get the top-left corner
            left: 'calc(43.75% - 80px)',  // 43.75% - half of width (140px/2)
            top: 'calc(76.85% - 8px)',    // 76.85% - half of height (~16px/2)
          }}
        >
          <div className="flex flex-col items-center" style={{ width: '180px' }}>
            <div className="flex items-center justify-between w-full mb-1">
              <div className="text-[var(--accent-teal)] font-['Manifold'] text-[10px]">LOADING</div>
              <div className="text-[var(--accent-teal)] font-['Manifold'] text-[10px]">{Math.round(progress)}%</div>
            </div>
            <div className="w-full h-2 overflow-hidden bg-[var(--tile-background)] border border-[var(--accent-teal)]">
              <div 
                className="h-full bg-[var(--accent-teal)]"
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 