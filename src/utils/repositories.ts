// Single swap point for storage migration (IndexedDB → Supabase)
// To migrate: comment out IndexedDB lines, uncomment Supabase lines
import {
  IndexedDBSessionRepository,
  IndexedDBFeedbackRepository,
} from '@/features/learning/repositories/IndexedDBSessionRepository';
import { IndexedDBDraftRepository } from '@/features/learning/repositories/IndexedDBDraftRepository';
import type { ISessionRepository, IFeedbackRepository } from '@/features/learning/repositories/ISessionRepository';
import type { IDraftRepository } from '@/features/learning/repositories/IDraftRepository';

export const sessionRepository: ISessionRepository = new IndexedDBSessionRepository();
export const feedbackRepository: IFeedbackRepository = new IndexedDBFeedbackRepository();
export const draftRepository: IDraftRepository = new IndexedDBDraftRepository();
