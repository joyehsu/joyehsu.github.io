import React from 'react';
import { BookOpen, LogIn, Calendar, HardDrive } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-12 w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full mb-4">
          <BookOpen className="w-12 h-12 text-indigo-600" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">tutorxyz</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600">AI單字家教</h2>
          <p className="text-slate-500 text-lg pt-2 max-w-md mx-auto">
            為孩子量身打造的專屬單字課。請先登入 Google 帳號以繼續使用。
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-2">為什麼需要登入 Google 帳號？</h3>
          
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">自動記錄學習歷程</h4>
              <p className="text-slate-500 text-sm">系統會將您的測驗成績與需要複習的單字，自動記錄到您的 Google 日曆中，方便追蹤學習進度。</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
              <HardDrive className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">安全儲存設定</h4>
              <p className="text-slate-500 text-sm">您的 AI 金鑰 (API Key) 將會安全地加密儲存在您個人 Google Drive 的專屬隱藏資料夾中，系統不會在伺服器端保留您的金鑰。</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={onLogin}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-1"
          >
            <LogIn className="w-6 h-6" />
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    </div>
  );
}
