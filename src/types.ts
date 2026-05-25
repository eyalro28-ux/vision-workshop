export interface Submission {
  id: string;
  ts: number;
  name: string;
  vision: string;
  values: string;
  action: string;
}

export interface Voice {
  quote: string;
  name: string;
}

export interface ActionItem {
  name: string;
  action: string;
}

export interface VisionCorePhrase {
  phrase: string;
  sources: string[];
}

export interface ValueContributor {
  name: string;
  originalValue: string;
}

export interface ValueProvenance {
  value: string;
  contributors: ValueContributor[];
}

export interface Vision {
  generatedAt: number;
  participantCount: number;
  visionCore: string;
  visionCoreSources?: VisionCorePhrase[];
  values: string[];
  valuesProvenance?: ValueProvenance[];
  voices: Voice[];
  actions: ActionItem[];
}

export interface ResponsesPayload {
  count: number;
  items: Submission[];
}

export interface ApiError {
  error: string;
  detail?: string;
}
