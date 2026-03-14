import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Play, ChevronLeft, Save } from 'lucide-react';
import { CustomList, Word } from '../types';
import { getCustomLists, deleteCustomList, updateCustomList } from '../services/history';

interface Props {
  onStartTest: (words: Word[], topic: string, level: string) => void;
}

export function HistoryTab({ onStartTest }: Props) {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [editingList, setEditingList] = useState<CustomList | null>(null);

  useEffect(() => {
    setLists(getCustomLists());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個單字表嗎？')) {
      deleteCustomList(id);
      setLists(getCustomLists());
    }
  };

  const handleSaveEdit = () => {
    if (editingList) {
      updateCustomList(editingList.id, editingList);
      setLists(getCustomLists());
      setEditingList(null);
    }
  };

  const handleWordChange = (index: number, field: keyof Word, value: string) => {
    if (editingList) {
      const newWords = [...editingList.words];
      newWords[index] = { ...newWords[index], [field]: value };
      setEditingList({ ...editingList, words: newWords });
    }
  };

  const handleTitleChange = (value: string) => {
    if (editingList) {
      setEditingList({ ...editingList, title: value });
    }
  };

  if (editingList) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setEditingList(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <input 
            type="text"
            value={editingList.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="flex-1 text-xl font-bold bg-transparent border-b-2 border-indigo-200 focus:border-indigo-500 outline-none px-2 py-1"
          />
          <button 
            onClick={handleSaveEdit}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            儲存
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {editingList.words.map((word, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">單字</label>
                  <input 
                    type="text"
                    value={word.word}
                    onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">翻譯</label>
                  <input 
                    type="text"
                    value={word.translation}
                    onChange={(e) => handleWordChange(index, 'translation', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">詞性</label>
                <input 
                  type="text"
                  value={word.partOfSpeech}
                  onChange={(e) => handleWordChange(index, 'partOfSpeech', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">例句</label>
                <input 
                  type="text"
                  value={word.exampleSentence}
                  onChange={(e) => handleWordChange(index, 'exampleSentence', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">例句翻譯</label>
                <input 
                  type="text"
                  value={word.exampleTranslation}
                  onChange={(e) => handleWordChange(index, 'exampleTranslation', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>目前沒有歷史紀錄。</p>
        <p className="text-sm mt-2">使用「拍照 / 上傳」或「手動輸入」產生的單字表會顯示在這裡。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {lists.map(list => (
        <div key={list.id} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-indigo-100 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{list.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(list.createdAt).toLocaleString()} · {list.words.length} 個單字
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingList(list)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="編輯"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(list.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="刪除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button 
            onClick={() => onStartTest(list.words, list.title, '歷史紀錄')}
            className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            開始測驗
          </button>
        </div>
      ))}
    </div>
  );
}
