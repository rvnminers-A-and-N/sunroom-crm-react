import type { Activity } from './activity';

export type DealStage = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
  contactName: string;
  contactId: number;
  companyName: string | null;
  companyId: number | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface DealDetail {
  id: number;
  title: string;
  value: number;
  stage: string;
  contactName: string;
  contactId: number;
  companyName: string | null;
  companyId: number | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  insights: DealInsight[];
}

export interface CreateDealRequest {
  title: string;
  value: number;
  contactId: number;
  companyId?: number;
  stage?: string;
  expectedCloseDate?: string;
  notes?: string;
}

export interface UpdateDealRequest {
  title: string;
  value: number;
  contactId: number;
  companyId?: number;
  stage?: string;
  expectedCloseDate?: string;
  notes?: string;
}

export interface DealFilterParams {
  page: number;
  perPage: number;
  search?: string;
  stage?: string;
  sort?: string;
  direction?: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
  deals: Deal[];
}

export interface Pipeline {
  stages: PipelineStage[];
}

export interface DealInsight {
  id: number;
  insight: string;
  generatedAt: string;
}
