export const createAudioUrl = (blob: Blob): string => URL.createObjectURL(blob);

export const revokeAudioUrl = (url: string): void => URL.revokeObjectURL(url);
