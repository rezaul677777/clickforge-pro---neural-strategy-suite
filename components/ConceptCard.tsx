
import React from 'react';
import { CTRConcept } from '../types';
import Button from './Button';

interface ConceptCardProps {
  concept: CTRConcept;
  onSelect: (concept: CTRConcept) => void;
  isGenerating: boolean;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, onSelect, isGenerating }) => {
  return (
    <div className="bg-[#0a0f1d] rounded-[2.5rem] p-8 border border-white/5 hover:border-blue-500/30 transition-all duration-500 group flex flex-col h-full shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
          Neural Match
        </span>
        <div className="flex -space-x-2">
          {concept.colorPalette.map((color, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0a0f1d] shadow-lg" style={{ backgroundColor: color }} title={color}></div>
          ))}
        </div>
      </div>

      <h3 className="text-xl font-black mb-3 text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{concept.title}</h3>
      <p className="text-slate-500 text-xs mb-8 leading-relaxed line-clamp-3 font-medium">
        {concept.description}
      </p>
      
      <div className="space-y-4 mb-8 flex-1">
        <div className="bg-black/40 rounded-3xl p-5 border border-white/5">
          <p className="text-[9px] text-slate-600 uppercase font-black mb-3 tracking-[0.2em]">Predicted Reception</p>
          <div className="space-y-3">
            {concept.audienceSentiment.slice(0, 2).map((s, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{s.segment}</span>
                <span className="text-[10px] text-blue-500 italic font-medium">"{s.reaction}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        variant="primary" 
        className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-blue-500/10" 
        onClick={() => onSelect(concept)}
        isLoading={isGenerating}
      >
        {isGenerating ? 'Building Assets...' : 'Deploy Strategy'}
      </Button>
    </div>
  );
};

export default ConceptCard;
