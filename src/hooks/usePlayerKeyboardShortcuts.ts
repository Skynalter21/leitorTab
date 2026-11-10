// Single Responsibility Hook: Handles global keyboard shortcuts for the Guitar Pro player

import { useEffect } from 'react';

interface PlayerKeyboardShortcutHandlers {
  enabled: boolean;
  onPlayPause: () => void;
  onToggleMuteFocused: () => void;
  onToggleSoloFocused: () => void;
  onToggleLoop: () => void;
  onSeekRelativeTicks: (deltaTicks: number) => void;
}

export function usePlayerKeyboardShortcuts({
  enabled,
  onPlayPause,
  onToggleMuteFocused,
  onToggleSoloFocused,
  onToggleLoop,
  onSeekRelativeTicks,
}: PlayerKeyboardShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (enabled) onPlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMuteFocused();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onToggleSoloFocused();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        onToggleLoop();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeekRelativeTicks(3840);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeekRelativeTicks(-3840);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onPlayPause,
    onToggleMuteFocused,
    onToggleSoloFocused,
    onToggleLoop,
    onSeekRelativeTicks,
  ]);
}

