import type { Contact } from './contact';
import type { Activity } from './activity';

export interface SummarizeRequest {
  text: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface SmartSearchRequest {
  query: string;
}

export interface SmartSearchResponse {
  interpretation: string;
  contacts: Contact[];
  activities: Activity[];
}
