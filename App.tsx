
import React, { useState, useEffect, useRef } from 'react';
import { CTRConcept, GeneratedThumbnail, GeneratorStatus, AspectRatio, GenerationParams } from './types';
import { brainstormCTRConcepts, generateImage, refineImage, generateSEOAssets } from './services/geminiService';
import Button from './components/Button';
import ConceptCard from './components/ConceptCard';

type AppStep = 'setup' | 'strategy' | 'vault';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<AppStep>('setup');
  const [params, setParams] = useState<GenerationParams>({
    topic: '',
    style: 'Professional',
    audience: 'General Interest',
    goal: 'Educational',
    aspectRatio: '16:9',
    lighting: 'Cinematic',
    angle: 'Eye-level',
    isViralMode: false
  });

  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [concepts, setConcepts] = useState<CTRConcept[]>([]);
  const [history, setHistory] = useState<GeneratedThumbnail[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeneratedThumbnail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');
  const [trends, setTrends] = useState<any[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('clickforge_v2_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (item: GeneratedThumbnail) => {
    const newHistory = [item, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('clickforge_v2_history', JSON.stringify(newHistory));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.topic.trim()) return;
    setError(null);
    setStatus(GeneratorStatus.ANALYZING);
    try {
      const { concepts: results, trends: searchTrends } = await brainstormCTRConcepts(params);
      setConcepts(results);
      setTrends(searchTrends || []);
      setStatus(GeneratorStatus.IDLE);
      setActiveStep('strategy');
    } catch (err) {
      setError('Market analysis interrupted. Please check your network and try again.');
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleGenerateImage = async (concept: CTRConcept) => {
    setError(null);
    setStatus(GeneratorStatus.GENERATING_IMAGE);
    try {
      const imageUrl = await generateImage(concept.visualPrompt, params.aspectRatio, params, sourceImage || undefined);
      const seo = await generateSEOAssets(concept, params);
      const result: GeneratedThumbnail = {
        id: `thumb-${Date.now()}`,
        imageUrl,
        concept,
        timestamp: Date.now(),
        seo,
        params: { ...params }
      };
      setSelectedResult(result);
      saveToHistory(result);
      setStatus(GeneratorStatus.COMPLETED);
    } catch (err) {
      setError('Image engine failed. Trying a different prompt might help.');
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleRefine = async () => {
    if (!selectedResult || !refineText.trim()) return;
    setStatus(GeneratorStatus.REFINING);
    try {
      const newUrl = await refineImage(selectedResult.imageUrl, refineText, params.aspectRatio);
      const updated = { ...selectedResult, imageUrl: newUrl };
      setSelectedResult(updated);
      setRefineText('');
      setStatus(GeneratorStatus.COMPLETED);
    } catch (err) {
      setError('Refinement unsuccessful. Our AI brush ran out of ink.');
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (!selectedResult) return;
    const link = document.createElement('a');
    link.href = selectedResult.imageUrl;
    link.download = `clickforge-${selectedResult.concept.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-[#02040a] text-slate-300 overflow-hidden">
      {/* Mobile-First Header */}
      <header className="safe-top glass-morphism sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase">ClickForge<span className="text-blue-500">PRO</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {trends.length > 0 && (
            <div className="hidden sm:flex px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Market Sync</span>
            </div>
          )}
          <button onClick={() => setActiveStep('vault')} className="p-2 hover:bg-slate-800 rounded-full transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />
            </svg>
            {history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-[#02040a]"></span>}
          </button>
        </div>
      </header>

      {/* App Core Container */}
      <main className="flex-1 overflow-y-auto relative pb-24">
        <div className="max-w-4xl mx-auto px-6 py-10">
          
          {/* Step 1: Setup */}
          {activeStep === 'setup' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="mb-10 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-white leading-tight mb-2">Build Your Strategy</h2>
                  <p className="text-slate-500 text-sm">Tell us about your content or upload a reference image to generate high-conversion visual concepts.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setParams({...params, isViralMode: !params.isViralMode})}
                  className={`flex flex-col items-center gap-1 transition-all p-3 rounded-2xl border ${params.isViralMode ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${params.isViralMode ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0121 13a7.98 7.98 0 01-3.343 5.657z" />
                  </svg>
                  <span className="text-[8px] font-black uppercase tracking-widest">Viral Mode</span>
                </button>
              </div>

              <form onSubmit={handleBrainstorm} className="space-y-8">
                <div className="space-y-6">
                   <div className="group">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Video Topic</label>
                      <input 
                        type="text" 
                        value={params.topic}
                        onChange={e => setParams({...params, topic: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-700 font-medium"
                        placeholder="e.g. Scaling a SaaS to $10k MRR"
                      />
                   </div>

                   {/* Aspect Ratio Selector */}
                   <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ml-1">Target Aspect Ratio</label>
                      <div className="flex flex-wrap gap-2">
                        {(["16:9", "9:16", "1:1", "4:3"] as AspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setParams({ ...params, aspectRatio: ratio })}
                            className={`px-6 py-3 rounded-xl text-xs font-black transition-all border ${
                              params.aspectRatio === ratio 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-[#0a0f1d] border-white/5 text-slate-500 hover:border-slate-700'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Image Upload Area */}
                   <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ml-1">Reference Image (Optional)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          sourceImage ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 bg-[#0a0f1d] hover:border-white/20'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {sourceImage ? (
                          <>
                            <img src={sourceImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Reference" />
                            <div className="relative z-10 text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs font-bold text-white uppercase tracking-widest">Image Loaded</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSourceImage(null); }} 
                                className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Click to upload reference</p>
                            <p className="text-[9px] text-slate-700 mt-1 uppercase">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Target Audience</label>
                        <input 
                          type="text"
                          value={params.audience}
                          onChange={e => setParams({...params, audience: e.target.value})}
                          className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 text-sm"
                          placeholder="e.g. Tech Founders"
                        />
                      </div>
                      <ConfigSelect label="Goal" value={params.goal} options={['Educational', 'Entertainment', 'Drama', 'Case Study']} onChange={v => setParams({...params, goal: v})} />
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <ConfigSelect label="Visual Style" value={params.style} options={['Professional', 'Vibrant', 'Minimal', 'Gritty']} onChange={v => setParams({...params, style: v})} />
                      <ConfigSelect label="Lighting" value={params.lighting} options={['Cinematic', 'Neon', 'Natural', 'Moody']} onChange={v => setParams({...params, lighting: v})} />
                      <ConfigSelect label="Angle" value={params.angle} options={['Eye-level', 'Wide', 'Close-up', 'Isometric']} onChange={v => setParams({...params, angle: v})} />
                   </div>
                </div>

                <Button type="submit" className={`w-full py-5 text-md font-black uppercase tracking-widest transition-all ${params.isViralMode ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/40' : 'shadow-blue-500/20'}`} isLoading={status === GeneratorStatus.ANALYZING}>
                  {status === GeneratorStatus.ANALYZING ? 'Scanning Trends...' : 'Start Viral Analysis'}
                </Button>
              </form>
            </div>
          )}

          {/* Step 2: Strategy / Results */}
          {activeStep === 'strategy' && (
            <div className="animate-in fade-in slide-in-from-right-6 duration-500">
               <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setActiveStep('setup')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-black text-white">Select Strategy</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {concepts.map((concept) => (
                    <ConceptCard 
                      key={concept.id} 
                      concept={concept} 
                      onSelect={handleGenerateImage}
                      isGenerating={status === GeneratorStatus.GENERATING_IMAGE}
                    />
                  ))}
               </div>
            </div>
          )}

          {/* Vault / History */}
          {activeStep === 'vault' && (
            <div className="animate-in fade-in slide-in-from-left-6 duration-500">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActiveStep('setup')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Vault</h2>
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={() => { if(confirm('Clear vault?')) {setHistory([]); localStorage.removeItem('clickforge_v2_history'); }}}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Clear All
                    </button>
                  )}
               </div>

               {history.length === 0 ? (
                 <div className="text-center py-24 border border-dashed border-white/5 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />
                       </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Your creative archive is currently empty.</p>
                    <button onClick={() => setActiveStep('setup')} className="mt-4 text-blue-500 font-bold uppercase text-[10px] tracking-widest">Start First Project</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => setSelectedResult(item)}
                        className="group relative bg-[#0a0f1d] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500 transition-all text-left"
                      >
                        <div className="aspect-video relative">
                          <img src={item.imageUrl} className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">{item.params.style}</p>
                            <h4 className="text-xs font-black text-white truncate uppercase">{item.concept.title}</h4>
                          </div>
                        </div>
                      </button>
                    ))}
                 </div>
               )}
            </div>
          )}

          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        </div>
      </main>

      {/* Persistent Bottom Nav (App Feel) */}
      <nav className="safe-bottom glass-morphism fixed bottom-0 left-0 right-0 z-40 px-8 py-4 flex justify-around border-t border-white/5 sm:hidden">
        <NavButton active={activeStep === 'setup'} onClick={() => setActiveStep('setup')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} label="Home" />
        <NavButton active={activeStep === 'vault'} onClick={() => setActiveStep('vault')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />} label="Vault" />
      </nav>

      {/* Editor/Result Workspace Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto">
          <div className="w-full max-w-6xl h-full sm:h-auto min-h-[100vh] sm:min-h-0 bg-[#02040a] sm:bg-transparent sm:glass-morphism sm:rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row border-0 sm:border border-white/5 animate-in fade-in zoom-in duration-300">
            {/* Asset Preview */}
            <div className="lg:w-2/3 bg-black relative p-6 flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${selectedResult.params.isViralMode ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></span>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{selectedResult.params.isViralMode ? 'Viral Asset Preview' : 'Master Preview'}</h3>
                  </div>
                  <button onClick={() => setSelectedResult(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <div className="flex-1 flex items-center justify-center bg-[#050810] rounded-2xl overflow-hidden relative shadow-2xl border border-white/5">
                  <img src={selectedResult.imageUrl} className="max-w-full max-h-[60vh] object-contain shadow-2xl" alt="" />
                  {status === GeneratorStatus.REFINING && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className={`w-12 h-12 border-2 ${selectedResult.params.isViralMode ? 'border-orange-500' : 'border-blue-500'} border-t-transparent animate-spin rounded-full mx-auto mb-4`}></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Processing Polish...</p>
                      </div>
                    </div>
                  )}
               </div>

               <div className="mt-6">
                  <Button variant="primary" className={`w-full py-4 text-sm font-black uppercase tracking-widest ${selectedResult.params.isViralMode ? 'bg-orange-600 hover:bg-orange-500' : ''}`} onClick={handleDownload}>
                    Download PNG High-Res
                  </Button>
               </div>
            </div>

            {/* Controls Panel */}
            <div className="lg:w-1/3 p-8 bg-[#070b14]/50 border-l border-white/5 overflow-y-auto space-y-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedResult.concept.title}</h3>
                  <p className={`${selectedResult.params.isViralMode ? 'text-orange-500' : 'text-blue-500'} text-[10px] font-bold uppercase tracking-widest`}>{selectedResult.params.isViralMode ? 'Viral Strategy Suite' : 'Active Workspace'}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In-Context Refinement</p>
                  <div className="bg-[#0a0f1d] p-5 rounded-2xl border border-white/5 shadow-inner">
                    <textarea 
                      value={refineText}
                      onChange={e => setRefineText(e.target.value)}
                      className="w-full bg-transparent text-sm resize-none h-24 outline-none placeholder:text-slate-800 font-medium text-slate-300"
                      placeholder="e.g. 'Make it look more futuristic' or 'Add a blue neon glow to the edges'"
                    />
                    <Button 
                      variant="secondary" 
                      className={`w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest ${selectedResult.params.isViralMode ? 'bg-purple-600' : ''}`} 
                      onClick={handleRefine}
                      isLoading={status === GeneratorStatus.REFINING}
                    >
                      Refine Asset
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SEO Meta-Strategy</p>
                  <div className="space-y-2">
                    {selectedResult.seo.suggestedTitles.slice(0, 3).map((title, i) => (
                      <div key={i} className="text-[11px] p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 leading-relaxed italic">
                        "{title}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <button onClick={() => setSelectedResult(null)} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">
                  Exit Strategy Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfigSelect = ({ label, value, options, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-[#0a0f1d] border border-white/5 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500/50 outline-none transition-all cursor-pointer hover:bg-slate-900 font-medium"
    >
      {options.map((opt: string) => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-blue-500' : 'text-slate-600'}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'fill-blue-500/10' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icon}
    </svg>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ErrorMessage = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed top-6 left-6 right-6 z-50 p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-4 backdrop-blur-md">
    <div className="flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
    <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </div>
);

export default App;
