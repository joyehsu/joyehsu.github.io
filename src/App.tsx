import React, { useState, useEffect } from 'react';
import { AppMode, Word, TestResult } from './types';
import { SetupScreen } from './components/SetupScreen';
import { LearningScreen } from './components/LearningScreen';
import { SpeakingScreen } from './components/SpeakingScreen';
import { WrittenScreen } from './components/WrittenScreen';
import { ReportScreen } from './components/ReportScreen';
import { BookOpen, Mic, PenTool, BarChart, LogIn, LogOut, Loader2 } from 'lucide-react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [mode, setMode] = useState<AppMode>('setup');
  const [words, setWords] = useState<Word[]>([]);
  const [speakingResults, setSpeakingResults] = useState<Partial<TestResult>[]>([]);
  const [writtenResults, setWrittenResults] = useState<Partial<TestResult>[]>([]);
  const [sessionInfo, setSessionInfo] = useState<{topic: string, level: string} | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: 'student',
              createdAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed:", error);
        alert("登入失敗，請重試。");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleRestart();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStart = (generatedWords: Word[], topic: string, level: string) => {
    setWords(generatedWords);
    setSessionInfo({ topic, level });
    setMode('learning');
  };

  const handleLearningComplete = () => {
    setMode('speaking');
  };

  const handleSpeakingComplete = (results: Partial<TestResult>[]) => {
    setSpeakingResults(results);
    setMode('written');
  };

  const handleWrittenComplete = async (results: Partial<TestResult>[]) => {
    setWrittenResults(results);
    setMode('report');
    
    // Save session to Firebase if logged in
    if (user && sessionInfo) {
      try {
        const sessionId = Date.now().toString();
        
        const totalWords = words.length;
        const writtenCorrectCount = results.filter(r => r.writtenCorrect).length;
        const writtenScore = Math.round((writtenCorrectCount / totalWords) * 100) || 0;
        
        const validSpeaking = speakingResults.filter(r => r.speakingScore !== undefined);
        const avgSpeakingScore = validSpeaking.length > 0 
          ? Math.round(validSpeaking.reduce((acc, curr) => acc + (curr.speakingScore || 0), 0) / validSpeaking.length)
          : 0;

        await setDoc(doc(db, 'sessions', sessionId), {
          userId: user.uid,
          topic: sessionInfo.topic,
          level: sessionInfo.level,
          createdAt: serverTimestamp(),
          words: words,
          speakingResults: speakingResults,
          writtenResults: results,
          writtenScore,
          avgSpeakingScore
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
  };

  const handleRestart = () => {
    setWords([]);
    setSpeakingResults([]);
    setWrittenResults([]);
    setSessionInfo(null);
    setMode('setup');
  };

  const steps = [
    { id: 'setup', icon: BookOpen, label: '設定' },
    { id: 'learning', icon: BookOpen, label: '學習' },
    { id: 'speaking', icon: Mic, label: '口說' },
    { id: 'written', icon: PenTool, label: '筆試' },
    { id: 'report', icon: BarChart, label: '報告' },
  ];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Header / Progress Bar */}
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4 md:gap-12">
          {steps.map((step, index) => {
            const isActive = mode === step.id;
            const isPast = steps.findIndex(s => s.id === mode) > index;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                  isPast ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`hidden md:block font-bold text-lg ${
                  isActive ? 'text-indigo-900' : 
                  isPast ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-12 h-1 rounded-full ml-4 ${
                    isPast ? 'bg-indigo-200' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-medium hidden sm:block">{user.displayName}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:block">登出</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-full hover:bg-indigo-100 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              登入以儲存紀錄
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {mode === 'setup' && <SetupScreen onStart={handleStart} />}
        {mode === 'learning' && <LearningScreen words={words} onComplete={handleLearningComplete} />}
        {mode === 'speaking' && <SpeakingScreen words={words} onComplete={handleSpeakingComplete} />}
        {mode === 'written' && <WrittenScreen words={words} onComplete={handleWrittenComplete} />}
        {mode === 'report' && (
          <ReportScreen 
            words={words} 
            speakingResults={speakingResults} 
            writtenResults={writtenResults} 
            onRestart={handleRestart} 
          />
        )}
      </main>
    </div>
  );
}
