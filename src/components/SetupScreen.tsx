import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Loader2, Camera, Upload, Image as ImageIcon, X, History, UserCircle2 } from 'lucide-react';
import { Word, TeacherStyle } from '../types';
import { generateVocabulary, extractWordsFromImage, extractWordsFromText } from '../services/gemini';
import { saveCustomList } from '../services/history';
import { HistoryTab } from './HistoryTab';

interface Props {
  onStart: (words: Word[], topic: string, level: string, teacherStyle: TeacherStyle) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [inputMode, setInputMode] = useState<'topic' | 'image' | 'text' | 'history'>('topic');
  const [topic, setTopic] = useState('學校生活與文具');
  const [level, setLevel] = useState('國一上學期');
  const [count, setCount] = useState(10);
  const [customText, setCustomText] = useState('');
  const [teacherStyle, setTeacherStyle] = useState<TeacherStyle>('enthusiastic');
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setIsCameraOpen(true);
      // Wait for the state to update and the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("無法開啟相機，請確認是否已授權相機權限。");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
        
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setSelectedImage(file);
          });
          
        stopCamera();
      }
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      let words: Word[] = [];
      let finalTopic = topic;
      let finalLevel = level;

      if (inputMode === 'topic') {
        words = await generateVocabulary(topic, level, count);
      } else if (inputMode === 'image' && selectedImage && imagePreview) {
        const base64Data = imagePreview.split(',')[1];
        words = await extractWordsFromImage(base64Data, selectedImage.type, count);
        
        if (words.length === 0) {
          alert('無法從圖片中辨識出任何英文單字，請重新拍攝或上傳更清晰的照片。');
          setIsLoading(false);
          return;
        }
        
        const savedList = saveCustomList('image', words);
        finalTopic = savedList.title;
        finalLevel = '自訂單字表';
      } else if (inputMode === 'text' && customText.trim()) {
        words = await extractWordsFromText(customText, count);
        
        if (words.length === 0) {
          alert('無法從文字中辨識出任何英文單字，請重新輸入。');
          setIsLoading(false);
          return;
        }
        
        const savedList = saveCustomList('text', words);
        finalTopic = savedList.title;
        finalLevel = '自訂單字表';
      }

      onStart(words, finalTopic, finalLevel, teacherStyle);
    } catch (error) {
      console.error(error);
      alert('產生單字失敗，請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">tutorxyz</h1>
          <h2 className="text-xl sm:text-2xl font-bold text-indigo-600">AI單字家教</h2>
          <p className="text-slate-500 text-base sm:text-lg pt-1">為孩子量身打造的專屬單字課</p>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setInputMode('topic')}
            className={`flex-1 py-3 px-2 text-sm sm:text-base font-medium rounded-lg transition-all whitespace-nowrap ${
              inputMode === 'topic' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            依主題產生
          </button>
          <button
            onClick={() => setInputMode('image')}
            className={`flex-1 py-3 px-2 text-sm sm:text-base font-medium rounded-lg transition-all whitespace-nowrap ${
              inputMode === 'image' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            拍照 / 上傳
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 py-3 px-2 text-sm sm:text-base font-medium rounded-lg transition-all whitespace-nowrap ${
              inputMode === 'text' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            手動輸入
          </button>
          <button
            onClick={() => setInputMode('history')}
            className={`flex-1 py-3 px-2 text-sm sm:text-base font-medium rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
              inputMode === 'history' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            歷史紀錄
          </button>
        </div>

        <div className="space-y-6">
          {inputMode === 'history' ? (
            <HistoryTab onStartTest={(words, topic, level) => onStart(words, topic, level, teacherStyle)} />
          ) : inputMode === 'topic' ? (
            <>
              <div>
                <label className="block text-lg font-medium text-slate-700 mb-2">年級、能力或課文範圍</label>
                <input 
                  type="text" 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full text-xl p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white"
                  placeholder="例如：國一上學期、A2 初級、康軒第三課..."
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-slate-700 mb-2">學習主題</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xl p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="例如：學校生活與文具、動物、水果..."
                />
              </div>
            </>
          ) : inputMode === 'image' ? (
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 mb-2">上傳單字表照片</label>
              
              {!imagePreview ? (
                isCameraOpen ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-black aspect-video flex flex-col items-center justify-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={stopCamera}
                        className="px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-full font-medium hover:bg-white/30 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="w-14 h-14 bg-white rounded-full border-4 border-indigo-500 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6 text-indigo-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="w-14 h-14 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                        <Camera className="w-7 h-7 text-slate-500 group-hover:text-indigo-600" />
                      </div>
                      <span className="text-slate-600 font-medium">即時拍攝</span>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="w-14 h-14 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                        <Upload className="w-7 h-7 text-slate-500 group-hover:text-indigo-600" />
                      </div>
                      <span className="text-slate-600 font-medium">上傳照片</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                  <img 
                    src={imagePreview} 
                    alt="Selected vocabulary list" 
                    className="w-full h-48 sm:h-64 object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="flex items-center text-white gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{selectedImage?.name || '已選擇照片'}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hidden file inputs */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 mb-2">輸入單字清單</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full h-48 text-lg p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none bg-white"
                placeholder="請輸入或貼上單字清單...&#10;例如：&#10;apple 蘋果&#10;banana 香蕉&#10;cat 貓"
              />
            </div>
          )}

          {inputMode !== 'history' && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-slate-700 mb-2">
                  {inputMode === 'topic' ? '單字數量' : '最多擷取單字數'} ({count} 個)
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="20" 
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-lg font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-indigo-500" />
                口語老師風格
              </div>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setTeacherStyle('enthusiastic')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  teacherStyle === 'enthusiastic' 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-800">熱情鼓勵型</div>
                <div className="text-xs text-slate-500 mt-1">高能量、充滿正能量，建立開口自信</div>
              </button>
              <button
                onClick={() => setTeacherStyle('strict')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  teacherStyle === 'strict' 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-800">嚴格精準型</div>
                <div className="text-xs text-slate-500 mt-1">講求效率與準確度，立刻指正瑕疵</div>
              </button>
              <button
                onClick={() => setTeacherStyle('socratic')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  teacherStyle === 'socratic' 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-800">蘇格拉底引導型</div>
                <div className="text-xs text-slate-500 mt-1">不直接給答案，用反問引導思考</div>
              </button>
              <button
                onClick={() => setTeacherStyle('humorous')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  teacherStyle === 'humorous' 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-800">幽默搞笑型</div>
                <div className="text-xs text-slate-500 mt-1">講話風趣，用搞笑例句幫助記憶</div>
              </button>
            </div>
          </div>
        </div>

        {inputMode !== 'history' && (
          <button 
            onClick={handleStart}
            disabled={isLoading || (inputMode === 'image' && !selectedImage) || (inputMode === 'text' && !customText.trim())}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-2xl font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>{inputMode === 'image' ? '正在辨識單字...' : inputMode === 'text' ? '正在處理單字...' : '正在產生單字...'}</span>
              </>
            ) : (
              '開始學習'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
