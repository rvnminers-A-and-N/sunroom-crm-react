import type { User } from '@core/models/user';
import type { Tag } from '@core/models/tag';
import type { Contact, ContactDetail } from '@core/models/contact';
import type { Company, CompanyDetail } from '@core/models/company';
import type { Deal, DealDetail, Pipeline } from '@core/models/deal';
import type { Activity } from '@core/models/activity';
import type { DashboardData } from '@core/models/dashboard';
import type { PaginatedResponse, PaginationMeta } from '@core/models/pagination';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'User',
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeAdmin(overrides: Partial<User> = {}): User {
  return makeUser({ id: 99, name: 'Admin User', role: 'Admin', ...overrides });
}

export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 1,
    name: 'VIP',
    color: '#ff8800',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    title: 'CEO',
    companyName: 'Acme Inc',
    companyId: 1,
    lastContactedAt: '2024-01-02T00:00:00Z',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeContactDetail(
  overrides: Partial<ContactDetail> = {},
): ContactDetail {
  return {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    title: 'CEO',
    notes: 'Important contact',
    lastContactedAt: '2024-01-02T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    company: null,
    tags: [],
    deals: [],
    activities: [],
    ...overrides,
  };
}

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 1,
    name: 'Acme Inc',
    industry: 'Technology',
    website: 'https://acme.test',
    phone: '555-9999',
    city: 'San Francisco',
    state: 'CA',
    contactCount: 3,
    dealCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeCompanyDetail(
  overrides: Partial<CompanyDetail> = {},
): CompanyDetail {
  return {
    id: 1,
    name: 'Acme Inc',
    industry: 'Technology',
    website: 'https://acme.test',
    phone: '555-9999',
    address: '123 Market St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    contacts: [],
    deals: [],
    ...overrides,
  };
}

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 1,
    title: 'New Deal',
    value: 5000,
    stage: 'Lead',
    contactName: 'Jane Doe',
    contactId: 1,
    companyName: 'Acme Inc',
    companyId: 1,
    expectedCloseDate: '2024-12-31',
    closedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeDealDetail(overrides: Partial<DealDetail> = {}): DealDetail {
  return {
    id: 1,
    title: 'New Deal',
    value: 5000,
    stage: 'Lead',
    contactName: 'Jane Doe',
    contactId: 1,
    companyName: 'Acme Inc',
    companyId: 1,
    expectedCloseDate: '2024-12-31',
    closedAt: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    activities: [],
    insights: [],
    ...overrides,
  };
}

export function makePipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    stages: [
      { stage: 'Lead', count: 1, totalValue: 1000, deals: [makeDeal({ id: 1 })] },
      { stage: 'Qualified', count: 0, totalValue: 0, deals: [] },
      { stage: 'Proposal', count: 0, totalValue: 0, deals: [] },
      { stage: 'Negotiation', count: 0, totalValue: 0, deals: [] },
      { stage: 'Won', count: 0, totalValue: 0, deals: [] },
      { stage: 'Lost', count: 0, totalValue: 0, deals: [] },
    ],
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    type: 'Note',
    subject: 'Sample activity',
    body: 'Body text',
    aiSummary: null,
    contactId: 1,
    contactName: 'Jane Doe',
    dealId: null,
    dealTitle: null,
    userName: 'Test User',
    occurredAt: '2024-01-02T00:00:00Z',
    createdAt: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

export function makeDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    totalContacts: 10,
    totalCompanies: 4,
    totalDeals: 6,
    totalPipelineValue: 250000,
    wonRevenue: 100000,
    dealsByStage: [
      { stage: 'Lead', count: 3, totalValue: 30000 },
      { stage: 'Qualified', count: 2, totalValue: 20000 },
      { stage: 'Won', count: 1, totalValue: 10000 },
    ],
    recentActivities: [
      {
        id: 1,
        type: 'Call',
        subject: 'Follow up',
        contactName: 'Jane Doe',
        userName: 'Test User',
        occurredAt: '2024-01-02T00:00:00Z',
      },
    ],
    ...overrides,
  };
}

export function makePaginated<T>(
  data: T[],
  meta: Partial<PaginationMeta> = {},
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      currentPage: 1,
      perPage: 10,
      total: data.length,
      lastPage: 1,
      ...meta,
    },
  };
}
