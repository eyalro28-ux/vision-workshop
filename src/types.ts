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

export interface Vision {
  generatedAt: number;
  participantCount: number;
  visionCore: string;
  values: string[];
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
