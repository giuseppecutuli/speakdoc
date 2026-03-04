export class TranscriberService {
  private finalTranscript = '';
  private interimTranscript = '';

  appendResult(transcript: string, isFinal: boolean): { final: string; interim: string } {
    if (isFinal) {
      this.finalTranscript = this.finalTranscript
        ? `${this.finalTranscript} ${transcript}`
        : transcript;
      this.interimTranscript = '';
    } else {
      this.interimTranscript = transcript;
    }
    return { final: this.finalTranscript, interim: this.interimTranscript };
  }

  getFullTranscript(): string {
    const interim = this.interimTranscript ? ` ${this.interimTranscript}` : '';
    return `${this.finalTranscript}${interim}`.trim();
  }

  reset(): void {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }
}
