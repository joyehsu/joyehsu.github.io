import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight, ChevronLeft, Loader2, Play } from 'lucide-react';
import { Word } from '../types';
import { generateAudio, generateTeacherScript } from '../services/gemini';

interface Props {
  words: Word[];
  onComplete: () => void;
}

export function LearningScreen({ words, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playIdRef = useRef<number>(0);

  const word = words[currentIndex];

  const stopCurrentAudio = () => {
    playIdRef.current += 1; // Increment to cancel any pending playAudio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // ignore
      }
      audioSourceRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAudio = async (text: string) => {
    if (isPlaying || isLoadingAudio) return;
    
    setIsLoadingAudio(true);
    const currentPlayId = ++playIdRef.current;
    
    const fallbackToBrowserTTS = () => {
      if (playIdRef.current !== currentPlayId) return;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any existing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-TW'; // Default to Chinese for mixed content
        utterance.onstart = () => {
          if (playIdRef.current === currentPlayId) setIsPlaying(true);
        };
        utterance.onend = () => {
          if (playIdRef.current === currentPlayId) setIsPlaying(false);
        };
        utterance.onerror = () => {
          if (playIdRef.current === currentPlayId) setIsPlaying(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    };

    try {
      const base64Audio = await generateAudio(text);
      if (playIdRef.current !== currentPlayId) return;
      
      if (base64Audio) {
        stopCurrentAudio();
        playIdRef.current = currentPlayId; // Restore the playId since stopCurrentAudio increments it
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Decode base64 to raw PCM bytes
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert 16-bit PCM to Float32 for Web Audio API
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        // Create audio buffer (1 channel, 24000 Hz)
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          if (playIdRef.current === currentPlayId) {
            setIsPlaying(false);
            audioSourceRef.current = null;
          }
        };
        
        audioSourceRef.current = source;
        setIsPlaying(true);
        source.start();
      } else {
        fallbackToBrowserTTS();
      }
    } catch (error) {
      console.warn("Audio generation failed, using fallback:", error);
      fallbackToBrowserTTS();
    } finally {
      if (playIdRef.current === currentPlayId) {
        setIsLoadingAudio(false);
      }
    }
  };

  const playTeacherScript = async () => {
    if (isPlaying || isLoadingAudio) return;
    setIsLoadingAudio(true);
    try {
      const script = await generateTeacherScript(word.word, word.translation);
      await playAudio(script);
    } catch (error) {
      console.error(error);
      setIsLoadingAudio(false);
    }
  };

  const handleNext = () => {
    stopCurrentAudio();
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    stopCurrentAudio();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-700">單字學習</h2>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-lg">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-12 flex flex-col items-center text-center"
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-lg font-medium mb-4">
                {word.partOfSpeech}
              </span>
              <h1 className="text-7xl font-bold text-slate-900 mb-4 tracking-tight">{word.word}</h1>
              <p className="text-3xl text-indigo-600 font-medium">{word.translation}</p>
            </div>

            <div className="flex gap-4 mb-10">
              <button 
                onClick={() => playAudio(word.word)}
                disabled={isLoadingAudio || isPlaying}
                className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors disabled:opacity-50"
                title="聽發音"
              >
                {isLoadingAudio ? <Loader2 className="w-10 h-10 animate-spin" /> : <Volume2 className="w-10 h-10" />}
              </button>
              <button 
                onClick={playTeacherScript}
                disabled={isLoadingAudio || isPlaying}
                className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50"
                title="老師講解"
              >
                {isLoadingAudio ? <Loader2 className="w-10 h-10 animate-spin" /> : <Play className="w-10 h-10 ml-1" />}
              </button>
            </div>

            <div className="w-full bg-slate-50 rounded-3xl p-8 text-left border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">例句 Example</h3>
                <button 
                  onClick={() => playAudio(word.exampleSentence)}
                  disabled={isLoadingAudio || isPlaying}
                  className="text-indigo-500 hover:text-indigo-700 disabled:opacity-50"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              <p className="text-2xl text-slate-800 font-medium mb-3 leading-relaxed">{word.exampleSentence}</p>
              <p className="text-xl text-slate-500">{word.exampleTranslation}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-6 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={handleNext}
          className="px-10 py-5 bg-indigo-600 text-white text-2xl font-bold rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          {currentIndex === words.length - 1 ? '完成學習' : '下一個'}
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
