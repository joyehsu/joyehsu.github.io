import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, RotateCcw, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { TestResult, Word } from '../types';

interface Props {
  words: Word[];
  speakingResults: Partial<TestResult>[];
  writtenResults: Partial<TestResult>[];
  onRestart: () => void;
}

export function ReportScreen({ words, speakingResults, writtenResults, onRestart }: Props) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Simple PIN for demo
      setIsUnlocked(true);
    } else {
      alert('密碼錯誤 (提示: 1234)');
      setPin('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">家長檢核區</h2>
          <p className="text-slate-500 mb-8">請輸入家長密碼以查看學習報告</p>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="輸入密碼 (1234)"
              className="w-full text-center text-3xl tracking-widest p-4 border-2 border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none"
              maxLength={4}
            />
            <button 
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-xl font-bold rounded-2xl shadow-lg shadow-amber-200 transition-all"
            >
              解鎖報告
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate scores
  const totalWords = words.length;
  const writtenCorrectCount = writtenResults.filter(r => r.writtenCorrect).length;
  const writtenScore = Math.round((writtenCorrectCount / totalWords) * 100) || 0;
  
  const validSpeaking = speakingResults.filter(r => r.speakingScore !== undefined);
  const avgSpeakingScore = validSpeaking.length > 0 
    ? Math.round(validSpeaking.reduce((acc, curr) => acc + (curr.speakingScore || 0), 0) / validSpeaking.length)
    : 0;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6 overflow-y-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full mb-4">
          <Award className="w-12 h-12 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800">學習成果報告</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center border-t-8 border-emerald-500">
          <h3 className="text-2xl font-bold text-slate-500 mb-2">口說平均分數</h3>
          <div className="text-7xl font-black text-emerald-500">{avgSpeakingScore}</div>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center border-t-8 border-blue-500">
          <h3 className="text-2xl font-bold text-slate-500 mb-2">筆試正確率</h3>
          <div className="text-7xl font-black text-blue-500">{writtenScore}%</div>
          <p className="text-lg text-slate-400 mt-2">{writtenCorrectCount} / {totalWords} 題</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-xl font-bold text-slate-600">單字</th>
              <th className="p-6 text-xl font-bold text-slate-600 text-center">筆試</th>
              <th className="p-6 text-xl font-bold text-slate-600 text-center">口說分數</th>
              <th className="p-6 text-xl font-bold text-slate-600">AI 口說建議</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word, index) => {
              const sResult = speakingResults.find(r => r.word === word.word);
              const wResult = writtenResults.find(r => r.word === word.word);
              
              return (
                <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-6">
                    <div className="font-bold text-2xl text-slate-800">{word.word}</div>
                    <div className="text-slate-500">{word.translation}</div>
                  </td>
                  <td className="p-6 text-center">
                    {wResult?.writtenCorrect ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`text-2xl font-bold ${
                      (sResult?.speakingScore || 0) >= 80 ? 'text-emerald-500' : 
                      (sResult?.speakingScore || 0) >= 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {sResult?.speakingScore || '-'}
                    </span>
                  </td>
                  <td className="p-6 text-lg text-slate-600 max-w-xs">
                    {sResult?.speakingFeedback || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pb-10">
        <button 
          onClick={onRestart}
          className="px-10 py-5 bg-slate-900 text-white text-2xl font-bold rounded-full hover:bg-slate-800 transition-colors flex items-center gap-3 shadow-xl"
        >
          <RotateCcw className="w-8 h-8" />
          開始新課程
        </button>
      </div>
    </div>
  );
}
