export class WaveformVisualizer {
  private animationId: number | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  async connect(stream: MediaStream): Promise<void> {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  draw(canvas: HTMLCanvasElement): void {
    if (!this.analyser || !this.dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser!.getByteFrequencyData(this.dataArray!);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'transparent';

      const barWidth = (canvas.width / this.dataArray!.length) * 2.5;
      let x = 0;

      for (let i = 0; i < this.dataArray!.length; i++) {
        const barHeight = (this.dataArray![i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + (this.dataArray![i] / 255) * 0.6})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }
}
