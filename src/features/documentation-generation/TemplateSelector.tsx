import { useTemplateStore } from '@/hooks/useTemplateStore';
import { DOC_TEMPLATES, TEMPLATE_IDS } from '@/constants/doc-templates';
import type { TemplateId } from '@/constants/doc-templates';

export const TemplateSelector = () => {
  const { selectedTemplateId, setTemplateId } = useTemplateStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTemplateId(e.target.value as TemplateId);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="template-selector" className="text-sm font-medium text-slate-700 whitespace-nowrap">
        Template
      </label>
      <select
        id="template-selector"
        value={selectedTemplateId}
        onChange={handleChange}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Documentation template"
        data-testid="template-selector"
      >
        {TEMPLATE_IDS.map((id) => (
          <option key={id} value={id}>
            {DOC_TEMPLATES[id].label}
          </option>
        ))}
      </select>
    </div>
  );
};
