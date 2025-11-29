import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import type { TrackWithArtist } from '@shared/schema';
import { useAuth } from './auth-context';

const PREVIEW_DURATION = 30; // 30 seconds preview for guests

interface AudioPlayerContextType {
  currentTrack: TrackWithArtist | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isPreviewMode: boolean;
  previewEnded: boolean;
  playTrack: (track: TrackWithArtist) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  queue: TrackWithArtist[];
  setQueue: (tracks: TrackWithArtist[]) => void;
  resetPreviewEnded: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<TrackWithArtist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<TrackWithArtist[]>([]);
  const [previewEnded, setPreviewEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const isPreviewMode = !user;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Stop at 30 seconds for preview mode (guests)
      if (isPreviewMode && audio.currentTime >= PREVIEW_DURATION) {
        audio.pause();
        setIsPlaying(false);
        setPreviewEnded(true);
      }
    };
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, isPreviewMode]);

  const playTrack = (track: TrackWithArtist) => {
    if (audioRef.current) {
      setCurrentTrack(track);
      setPreviewEnded(false);
      audioRef.current.src = track.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const resetPreviewEnded = () => {
    setPreviewEnded(false);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    }
  };

  const previousTrack = () => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isPreviewMode,
        previewEnded,
        playTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        nextTrack,
        previousTrack,
        queue,
        setQueue,
        resetPreviewEnded,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
