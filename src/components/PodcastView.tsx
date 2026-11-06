import React, { useState, useRef, useEffect } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Volume2, 
  Edit3, 
  Save, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  Clock,
  Check,
  VolumeX
} from 'lucide-react';
import { KitPodcast, KitSource } from '../types';
import { ApiService } from '../services/api';

interface PodcastViewProps {
  podcast?: KitPodcast;
  source: KitSource;
  kitTitle: string;
  onUpdatePodcast: (newPodcast: KitPodcast) => void;
}

export const PodcastView: React.FC<PodcastViewProps> = ({
  podcast,
  source,
  kitTitle,
  onUpdatePodcast,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcast?.durationSeconds || 160);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);

  // Script editing mode
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState(podcast?.script || '');

  // Generation state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isRegeneratingScript, setIsRegeneratingScript] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync draft if prop updates
  useEffect(() => {
    if (podcast?.script) {
      setScriptDraft(podcast.script);
    }
    if (podcast?.durationSeconds) {
      setDuration(podcast.durationSeconds);
    }
  }, [podcast]);

  // Audio time update listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [podcast?.audioUrl]);

  // Toggle Play / Pause (supports native audio tag or Web Speech API fallback)
  const togglePlay = () => {
    if (podcast?.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
          console.warn('Audio play failed, switching to speech synth', err);
          playWithWebSpeech();
        });
      }
    } else {
      // Use Web Speech API
      playWithWebSpeech();
    }
  };

  const playWithWebSpeech = () => {
    if (!('speechSynthesis' in window)) {
      setErrorMsg('Ваш браузер не поддерживает синтез речи.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = podcast?.script || scriptDraft;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ru-RU';
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : volume;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(duration);
    };
    utterance.onerror = () => setIsPlaying(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current && podcast?.audioUrl) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current && podcast?.audioUrl) {
      const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    } else {
      handleSeek(Math.max(0, Math.min(duration, currentTime + seconds)));
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (isPlaying && speechUtteranceRef.current) {
      // Re-trigger with new rate
      window.speechSynthesis.cancel();
      playWithWebSpeech();
    }
  };

  // Synthesize audio using Gemini TTS
  const handleSynthesizeAudio = async () => {
    if (!podcast?.script && !scriptDraft) return;
    setIsSynthesizing(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.generateAudio(scriptDraft);
      const updated: KitPodcast = {
        script: scriptDraft,
        originalScript: podcast?.originalScript || scriptDraft,
        isEdited: scriptDraft !== (podcast?.originalScript || scriptDraft),
        audioUrl: res.audioUrl,
        durationSeconds: res.durationSeconds,
        audioStatus: 'ready',
        generatedAt: new Date().toISOString(),
      };
      onUpdatePodcast(updated);
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка генерации аудио');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Save manual script edit
  const handleSaveScript = () => {
    if (!podcast) return;
    const isEdited = scriptDraft.trim() !== (podcast.originalScript || '').trim();
    onUpdatePodcast({
      ...podcast,
      script: scriptDraft,
      isEdited,
    });
    setIsEditingScript(false);
  };

  // Regenerate script from source
  const handleRegenerateScript = async () => {
    setIsRegeneratingScript(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.regenerateComponent({
        component: 'podcast',
        title: kitTitle,
        rawText: source.rawText,
        pages: source.pages,
      });
      if (res.data?.script) {
        const updated: KitPodcast = {
          script: res.data.script,
          originalScript: res.data.script,
          isEdited: false,
          audioStatus: 'not_generated',
          generatedAt: new Date().toISOString(),
        };
        setScriptDraft(res.data.script);
        onUpdatePodcast(updated);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Не удалось пересоздать сценарий');
    } finally {
      setIsRegeneratingScript(false);
    }
  };

  // Download audio or script
  const handleDownloadAudio = () => {
    if (podcast?.audioUrl) {
      const a = document.createElement('a');
      a.href = podcast.audioUrl;
      a.download = `Подкаст_${kitTitle.slice(0, 30)}.wav`;
      a.click();
    } else {
      // Download script text
      const blob = new Blob([podcast?.script || scriptDraft], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Сценарий_подкаста_${kitTitle.slice(0, 30)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!podcast) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-semibold text-slate-900">Подкаст пока не создан</h3>
          <p className="text-xs text-slate-500 mt-1">
            Сгенерируйте сценарий и аудиоподкаст по материалам комплекта.
          </p>
        </div>
        <button
          onClick={handleRegenerateScript}
          disabled={isRegeneratingScript}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Создать сценарий</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element if URL exists */}
      {podcast.audioUrl && (
        <audio
          ref={audioRef}
          src={podcast.audioUrl}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Warning banner when student modified the script (Section 6.5) */}
      {podcast.isEdited && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Внимание: </span>
            Измененные фрагменты сценария не проходили первоначальную проверку соответствия источнику.
          </div>
        </div>
      )}

      {/* AUDIO PLAYER CONSOLE */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-indigo-300 font-medium">
                Образовательный аудиоподкаст (1 диктор)
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {kitTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
              title={podcast.audioUrl ? 'Скачать аудио' : 'Скачать сценарий'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{podcast.audioUrl ? 'Скачать аудио' : 'Скачать текст'}</span>
            </button>
            <button
              onClick={handleSynthesizeAudio}
              disabled={isSynthesizing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              title="Запустить озвучивание сценария через ИИ"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
              <span>{isSynthesizing ? 'Озвучиваем...' : 'Озвучить ИИ'}</span>
            </button>
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Skip & Play Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Назад на 10 секунд"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Вперед на 10 секунд"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Presets (0.75x, 1x, 1.25x, 1.5x, 2x as per ТЗ) */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setIsMuted(false);
                if (audioRef.current) {
                  audioRef.current.volume = Number(e.target.value);
                }
              }}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* SCRIPT SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              Текст сценария подкаста
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Последовательное раскрытие темы диктором с введением, терминами и выводами.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditingScript ? (
              <>
                <button
                  onClick={() => {
                    setScriptDraft(podcast.script);
                    setIsEditingScript(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить правки</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRegenerateScript}
                  disabled={isRegeneratingScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  title="Сгенерировать новый вариант сценария"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingScript ? 'animate-spin' : ''}`} />
                  <span>Пересоздать</span>
                </button>
                <button
                  onClick={() => setIsEditingScript(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Редактировать текст</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Script Content or Editor */}
        {isEditingScript ? (
          <div className="space-y-2">
            <textarea
              rows={14}
              value={scriptDraft}
              onChange={(e) => setScriptDraft(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
            />
            <div className="text-xs text-slate-500">
              Вы можете изменить текст перед озвучиванием. По ТЗ измененный сценарий будет помечен специальным индикатором.
            </div>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans space-y-4">
            {podcast.script}
          </div>
        )}
      </div>
    </div>
  );
};
