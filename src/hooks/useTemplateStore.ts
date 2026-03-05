import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/config';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS } from '@/constants/doc-templates';
import type { TemplateId } from '@/constants/doc-templates';

interface TemplateState {
  selectedTemplateId: TemplateId;
}

interface TemplateActions {
  setTemplateId: (id: TemplateId) => void;
  loadFromStorage: () => void;
}

const loadStoredTemplateId = (): TemplateId => {
  const stored = localStorage.getItem(STORAGE_KEYS.DOC_TEMPLATE);
  return TEMPLATE_IDS.includes(stored as TemplateId) ? (stored as TemplateId) : DEFAULT_TEMPLATE_ID;
};

export const useTemplateStore = create<TemplateState & TemplateActions>((set) => ({
  selectedTemplateId: DEFAULT_TEMPLATE_ID,

  setTemplateId: (id) => {
    localStorage.setItem(STORAGE_KEYS.DOC_TEMPLATE, id);
    set({ selectedTemplateId: id });
  },

  loadFromStorage: () => set({ selectedTemplateId: loadStoredTemplateId() }),
}));
