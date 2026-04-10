import type { HttpHandler } from 'msw';
import { authHandlers } from './auth';
import { contactsHandlers } from './contacts';
import { companiesHandlers } from './companies';
import { dealsHandlers } from './deals';
import { activitiesHandlers } from './activities';
import { dashboardHandlers } from './dashboard';
import { tagsHandlers } from './tags';
import { usersHandlers } from './users';
import { aiHandlers } from './ai';

export { API_URL, url } from './url';

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...contactsHandlers,
  ...companiesHandlers,
  ...dealsHandlers,
  ...activitiesHandlers,
  ...dashboardHandlers,
  ...tagsHandlers,
  ...usersHandlers,
  ...aiHandlers,
];
