export type ActivityType = 'Note' | 'Call' | 'Email' | 'Meeting' | 'Task';

export interface Activity {
  id: number;
  type: string;
  subject: string;
  body: string | null;
  aiSummary: string | null;
  contactId: number | null;
  contactName: string | null;
  dealId: number | null;
  dealTitle: string | null;
  userName: string;
  occurredAt: string;
  createdAt: string;
}

export interface CreateActivityRequest {
  type: string;
  subject: string;
  body?: string;
  contactId?: number;
  dealId?: number;
  occurredAt?: string;
}

export interface UpdateActivityRequest {
  type: string;
  subject: string;
  body?: string;
  contactId?: number;
  dealId?: number;
  occurredAt?: string;
}

export interface ActivityFilterParams {
  page: number;
  perPage: number;
  contactId?: number;
  dealId?: number;
  type?: string;
  sort?: string;
  direction?: string;
}
