import type { Contact } from './contact';
import type { Deal } from './deal';

export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  contactCount: number;
  dealCount: number;
  createdAt: string;
}

export interface CompanyDetail {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  deals: Deal[];
}

export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export type UpdateCompanyRequest = CreateCompanyRequest;
