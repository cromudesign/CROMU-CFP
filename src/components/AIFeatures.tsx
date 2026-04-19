import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, Loader2, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Declaration for the AI Studio key selection API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const AIFeatures: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Check if API key is selected (for models that require it)
  React.useEffect(() => {
    window.aistudio.hasSelectedApiKey().then(setHasApiKey);
  }, []);

  const handleOpenKeySelector = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

  const generateImage = async () => {
    if (!prompt) return;
    setIsGeneratingImage(true);
    setError(null);
    setGeneratedVideo(null);
    
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ parts: [{ text: `Realistically visualize this financial goal: ${prompt}` }] }],
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: imageSize
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } else {
        throw new Error('Nenhuma imagem retornada pelo modelo.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('entity was not found')) {
        setHasApiKey(false);
      }
      setError('Falha ao gerar imagem. Verifique se você possui créditos e acesso ao modelo.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateVideo = async () => {
    if (!generatedImage) return;
    setIsGeneratingVideo(true);
    setError(null);
    
    try {
      const ai = getAI();
      // Step 1: Start the operation
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: `Cinematic animation of this financial target: ${prompt}. Slow camera motion, professional lighting.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      // Step 2: Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch the video content using the API key in headers as per skill instructions
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY || '',
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setGeneratedVideo(videoUrl);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('entity was not found')) {
        setHasApiKey(false);
      }
      setError('Falha ao gerar vídeo. A geração de vídeo pode demorar alguns minutos ou exigir permissões específicas.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-800">Visualizador de Metas (IA)</h2>
      </div>

      {!hasApiKey && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-800 mb-3 font-medium">
            Para usar IA de alta qualidade (Gemini 3 Pro e Veo), você precisa selecionar uma chave API de projeto pago.
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-all"
          >
            <Key className="w-4 h-4" />
            Configurar Chave API
          </button>
          <p className="mt-2 text-[10px] text-amber-600 text-center">
            Consulte <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">documentação de faturamento</a>.
          </p>
        </div>
      )}

      <p className="text-sm text-slate-500 mb-6 italic">
        "Descreva seu sonho financeiro e peça à IA para dar vida a ele."
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Qual é o seu objetivo?</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Uma casa na praia..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
            <div className="flex gap-1">
              {(['1K', '2K', '4K'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setImageSize(size)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded border transition-all",
                    imageSize === size 
                      ? "bg-slate-900 border-slate-900 text-white" 
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateImage}
          disabled={isGeneratingImage || !prompt || !hasApiKey}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all",
            isGeneratingImage || !prompt || !hasApiKey
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100"
          )}
        >
          {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          {isGeneratingImage ? 'Gerando Imagem...' : 'Gerar Visão do Objetivo'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center">
          <AnimatePresence mode="wait">
            {generatedVideo ? (
              <motion.video
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={generatedVideo}
                controls
                className="w-full h-full object-cover"
              />
            ) : generatedImage ? (
              <motion.img
                key="image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={generatedImage}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-300 flex flex-col items-center gap-2">
                <ImageIcon className="w-12 h-12 opacity-20" />
                <p className="text-xs">Sua visualização aparecerá aqui</p>
              </div>
            )}
          </AnimatePresence>

          {isGeneratingVideo && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-bold mb-1 text-sm">Animando sua meta...</p>
              <p className="text-[10px] opacity-80">Isso pode levar alguns minutos. Estamos criando uma animação cinematográfica.</p>
            </div>
          )}
        </div>

        {generatedImage && !generatedVideo && (
          <button
            onClick={generateVideo}
            disabled={isGeneratingVideo || !hasApiKey}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all bg-purple-500 hover:bg-purple-600 text-white shadow-md shadow-purple-100 mt-2",
              (isGeneratingVideo || !hasApiKey) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Video className="w-5 h-5" />
            Animar Imagem para Vídeo (Veo)
          </button>
        )}
      </div>
    </div>
  );
};
