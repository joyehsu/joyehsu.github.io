import React from 'react';
import { motion } from 'motion/react';
import { Award, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { TestResult, Word } from '../types';

interface Props {
  words: Word[];
  speakingResults: Partial<TestResult>[];
  writtenResults: Partial<TestResult>[];
  onRestart: () => void;
}

export function ReportScreen({ words, speakingResults, writtenResults, onRestart }: Props) {
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
