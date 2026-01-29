
import React from 'react';
import { GeneratedThumbnail } from '../types';
import Button from './Button';

interface ThumbnailResultProps {
  thumbnail: GeneratedThumbnail;
  onClose: () => void;
}

const ThumbnailResult: React.FC<ThumbnailResultProps> = ({ thumbnail, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = thumbnail.imageUrl;
    link.download = `clickforge-${thumbnail.concept.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-morphism max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3 bg-slate-950 flex items-center justify-center relative group">
            <img 
              src={thumbnail.imageUrl} 
              alt={thumbnail.concept.title} 
              className="w-full h-auto object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-6 py-2 bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">AI Generated Preview</p>
                </div>
            </div>
          </div>
          
          <div className="md:w-1/3 p-8 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">{thumbnail.concept.title}</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Visual Concept</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{thumbnail.concept.description}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Psychological Edge</p>
                  <p className="text-blue-400 text-sm italic">{thumbnail.concept.psychology}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={handleDownload}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download HD PNG
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Generate More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailResult;
