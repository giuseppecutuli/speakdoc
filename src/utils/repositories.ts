// Single swap point for storage migration (IndexedDB → Supabase)
// To migrate: comment out IndexedDB lines, uncomment Supabase lines
import {
  IndexedDBSessionRepository,
  IndexedDBFeedbackRepository,
} from '@/features/learning/repositories/IndexedDBSessionRepository';
import type { ISessionRepository, IFeedbackRepository } from '@/features/learning/repositories/ISessionRepository';

export const sessionRepository: ISessionRepository = new IndexedDBSessionRepository();
export const feedbackRepository: IFeedbackRepository = new IndexedDBFeedbackRepository();
