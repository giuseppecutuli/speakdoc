export const GEMINI_NANO_FLAG_STEPS = [
  {
    label: 'Open Prompt API flag',
    flag: 'chrome://flags/#prompt-api-for-gemini-nano',
    action: 'Set to Enabled',
  },
  {
    label: 'Open On-Device Model flag',
    flag: 'chrome://flags/#optimization-guide-on-device-model',
    action: 'Set to Enabled BypassPerfRequirement',
  },
] as const;
