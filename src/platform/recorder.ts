export interface Recording { stop(): Promise<Blob | null> }

export const recorderSupported = () =>
  typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

/** Records the microphone until stop(). Resolves to null if recording is not possible. */
export async function startRecording(): Promise<Recording> {
  if (!recorderSupported()) return { stop: async () => null };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
    return {
      stop: () =>
        new Promise((done) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            done(chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null);
          };
          rec.state === 'inactive' ? rec.onstop(new Event('stop')) : rec.stop();
        }),
    };
  } catch {
    return { stop: async () => null };
  }
}
