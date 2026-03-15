import React, { useState } from 'react';
import { Key, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onSave: (key: string) => Promise<void>;
  onCancel?: () => void;
  initialKey?: string;
}

export function ApiKeySetupScreen({ onSave, onCancel, initialKey = '' }: Props) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setIsSaving(true);
    await onSave(apiKey.trim());
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-2">
            <Key className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">設定 Gemini API Key</h2>
          <p className="text-slate-500 text-lg">
            本系統需要使用 Google Gemini AI 來為您產生專屬單字與進行口說對話。
            您的金鑰將會安全地儲存在您個人的 Google Drive 應用程式資料夾中。
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
            取得 API Key
          </h3>
          <p className="text-slate-600 text-sm pl-8">
            請前往 Google AI Studio 取得免費的 API Key。
          </p>
          <div className="pl-8">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
            >
              前往 Google AI Studio <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
            輸入 API Key
          </h3>
          <div className="pl-8">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving}
            className="flex-1 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                儲存並開始使用
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
