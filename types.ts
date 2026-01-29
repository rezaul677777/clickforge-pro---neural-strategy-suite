
export interface CTRConcept {
  id: string;
  title: string;
  description: string;
  visualPrompt: string;
  overlayText: string;
  overlayVariants: string[];
  psychology: string;
  colorPalette: string[];
  audienceSentiment: {
    segment: string;
    reaction: string;
  }[];
}

export interface GeneratedThumbnail {
  id: string;
  imageUrl: string;
  concept: CTRConcept;
  timestamp: number;
  seo: {
    suggestedTitles: string[];
    tags: string[];
  };
  params: GenerationParams;
}

export enum GeneratorStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  REFINING = 'REFINING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

export interface GenerationParams {
  topic: string;
  style: string;
  audience: string;
  goal: string;
  aspectRatio: AspectRatio;
  lighting: string;
  angle: string;
  isViralMode?: boolean; // New flag for MrBeast style
}
