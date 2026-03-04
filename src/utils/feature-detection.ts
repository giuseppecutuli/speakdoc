export const isSpeechRecognitionAvailable = (): boolean =>
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

export const isMediaRecorderAvailable = (): boolean => 'MediaRecorder' in window;

export const isClipboardAvailable = (): boolean =>
  'clipboard' in navigator && 'writeText' in navigator.clipboard;
