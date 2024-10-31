import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, Pause, Play, Music, ChevronRight, ChevronLeft, Rocket, Lock, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const levels = [
  {
    id: 1,
    name: "Solar System Basics",
    description: "Start with the fundamental rhythms of our solar system",
    requiredScore: 0,
    celestialBodies: [
      {
        id: 1,
        name: 'Pulsing Star',
        type: 'star',
        description: 'A young star pulsating with energy. Fun fact: Stars actually do make sound waves, but space is too empty for us to hear them!',
        color: '#FFD700',
        size: 'h-16 w-16',
        position: 'top-20 left-20',
        soundConfig: {
          frequency: 440,
          waveform: 'sine',
          pulseRate: 500,
          filterFreq: 1000
        }
      },
      {
        id: 2,
        name: 'Mercury',
        type: 'planet',
        description: 'The smallest planet, racing around the sun. Fun fact: Despite being closest to the sun, Mercury is not the hottest planet!',
        color: '#A0522D',
        size: 'h-12 w-12',
        position: 'top-40 left-60',
        soundConfig: {
          frequency: 523.25,
          waveform: 'triangle',
          pulseRate: 800,
          filterFreq: 2000
        }
      }
    ]
  },
  {
    id: 2,
    name: "Cosmic Harmony",
    description: "Explore the outer planets and their moons",
    requiredScore: 100,
    celestialBodies: [
      {
        id: 3,
        name: 'Jupiter',
        type: 'planet',
        description: 'The giant planet with its massive storms. Fun fact: Jupiter\'s Great Red Spot has been raging for at least 400 years!',
        color: '#FFA500',
        size: 'h-24 w-24',
        position: 'top-30 left-40',
        soundConfig: {
          frequency: 329.63,
          waveform: 'sawtooth',
          pulseRate: 1200,
          filterFreq: 500
        }
      },
      {
        id: 4,
        name: 'Saturn\'s Rings',
        type: 'rings',
        description: 'The iconic rings made of ice and rock. Fun fact: Saturn\'s rings are only about 10 meters thick on average!',
        color: '#DEB887',
        size: 'h-20 w-20',
        position: 'top-60 left-70',
        soundConfig: {
          frequency: 392,
          waveform: 'square',
          pulseRate: 600,
          filterFreq: 1500
        }
      }
    ]
  },
  {
    id: 3,
    name: "Deep Space Wonders",
    description: "Venture into the mysteries of deep space",
    requiredScore: 250,
    celestialBodies: [
      {
        id: 5,
        name: 'Nebula',
        type: 'nebula',
        description: 'A cosmic cloud where stars are born. Fun fact: Some nebulae are so large they span hundreds of light-years!',
        color: '#FF69B4',
        size: 'h-28 w-28',
        position: 'top-20 left-80',
        soundConfig: {
          frequency: 293.66,
          waveform: 'sine',
          pulseRate: 2000,
          filterFreq: 800
        }
      },
      {
        id: 6,
        name: 'Black Hole',
        type: 'blackhole',
        description: 'A region where gravity is so strong that nothing can escape. Fun fact: Time moves slower near a black hole!',
        color: '#4B0082',
        size: 'h-32 w-32',
        position: 'top-50 left-30',
        soundConfig: {
          frequency: 146.83,
          waveform: 'sawtooth',
          pulseRate: 1500,
          filterFreq: 300
        }
      }
    ]
  }
];

const StellarSoundscapes = () => {
  // State
  const [activeObjects, setActiveObjects] = useState(new Set());
  const [volume, setVolume] = useState(50);
  const [description, setDescription] = useState('');
  const [audioContext, setAudioContext] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notification, setNotification] = useState('');
  const [showMenu, setShowMenu] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [score, setScore] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState(new Set([1]));

  const elementRefs = useRef({});
  const intervalRefs = useRef([]);

  // Initialize Audio Context
  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
    
    // Load saved progress
    const savedScore = localStorage.getItem('stellarScore');
    const savedUnlockedLevels = localStorage.getItem('stellarUnlockedLevels');
    
    if (savedScore) {
      setScore(parseInt(savedScore));
    }
    if (savedUnlockedLevels) {
      setUnlockedLevels(new Set(JSON.parse(savedUnlockedLevels)));
    }

    return () => {
      if (context) {
        context.close();
      }
      intervalRefs.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  // Sound Generation
  const createSound = useCallback((body) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = body.soundConfig.waveform;
    oscillator.frequency.setValueAtTime(body.soundConfig.frequency, audioContext.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(body.soundConfig.filterFreq, audioContext.currentTime);
    filter.Q.setValueAtTime(10, audioContext.currentTime);

    gainNode.gain.setValueAtTime((volume / 100) * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);

    // Add score when creating sounds
    setScore(prev => {
      const newScore = prev + 10;
      localStorage.setItem('stellarScore', newScore.toString());
      
      // Check for level unlocks
      levels.forEach(level => {
        if (level.requiredScore <= newScore) {
          setUnlockedLevels(prev => {
            const newUnlocked = new Set(prev).add(level.id);
            localStorage.setItem('stellarUnlockedLevels', JSON.stringify([...newUnlocked]));
            return newUnlocked;
          });
        }
      });
      
      return newScore;
    });
  }, [audioContext, volume]);

  // Event Handlers
  const toggleCelestialBody = (body) => {
    const newActiveObjects = new Set(activeObjects);
    
    if (newActiveObjects.has(body.id)) {
      newActiveObjects.delete(body.id);
    } else {
      newActiveObjects.add(body.id);
      setDescription(body.description);
      createSound(body);
    }
    
    setActiveObjects(newActiveObjects);
  };

  const startPlayback = () => {
    setIsPlaying(true);
    activeObjects.forEach(id => {
      const body = currentLevel?.celestialBodies.find(b => b.id === id);
      if (body) {
        const interval = setInterval(() => createSound(body), body.soundConfig.pulseRate);
        intervalRefs.current.push(interval);
      }
    });
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    intervalRefs.current.forEach(interval => clearInterval(interval));
    intervalRefs.current = [];
  };

  const selectLevel = (level) => {
    if (!unlockedLevels.has(level.id)) return;
    setCurrentLevel(level);
    setShowMenu(false);
    setActiveObjects(new Set());
    stopPlayback();
    setDescription(`Welcome to ${level.name}! ${level.description}`);
  };

  const handleVolumeChange = (values) => {
    setVolume(values[0]);
  };

  if (showMenu) {
    return (
      <Card className="w-full max-w-4xl bg-slate-900 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Stellar Soundscapes</h2>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>{score} points</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {levels.map((level) => (
              <div
                key={level.id}
                className={`p-4 rounded-lg ${
                  unlockedLevels.has(level.id) 
                    ? 'bg-slate-800 cursor-pointer hover:bg-slate-700' 
                    : 'bg-slate-800/50 opacity-75'
                }`}
                onClick={() => selectLevel(level)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    {level.name}
                  </h3>
                  {!unlockedLevels.has(level.id) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4" />
                      <span>Requires {level.requiredScore} points</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-300">{level.description}</p>
                <div className="mt-2 flex gap-2">
                  {level.celestialBodies.map((body) => (
                    <div
                      key={body.id}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: body.color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl bg-slate-900 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={() => {
              setShowMenu(true);
              stopPlayback();
            }}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Levels
          </Button>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span>{score} points</span>
          </div>
        </div>

        <div className="relative h-96 bg-slate-800 rounded-lg overflow-hidden mb-4">
          <div className="absolute inset-0 bg-slate-900">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {currentLevel?.celestialBodies.map((body) => (
            <button
              key={body.id}
              ref={el => elementRefs.current[body.id] = el}
              onClick={() => toggleCelestialBody(body)}
              className={`absolute rounded-full transition-transform ${body.size} ${body.position} 
                ${activeObjects.has(body.id) ? 'animate-pulse scale-110 shadow-lg shadow-current' : ''}`}
              style={{ backgroundColor: body.color }}
            >
              <span className="sr-only">{body.name}</span>
            </button>
          ))}
        </div>

        <div className="h-20 mb-4 p-4 bg-slate-800 rounded-lg">
          <p className="text-sm">{description || "Tap on celestial objects to create your cosmic symphony!"}</p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            ref={el => elementRefs.current.playButton = el}
            onClick={isPlaying ? stopPlayback : startPlayback}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
            {isPlaying ? 'Stop' : 'Play'}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="h-4 w-4" />
            <div ref={el => elementRefs.current.volumeSlider = el}>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-32"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="text-sm">Active Sounds: {activeObjects.size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StellarSoundscapes;
