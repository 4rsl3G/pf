export function openSSE(url: string, onEvent: (ev: MessageEvent) => void, onError?: () => void) {
  const es = new EventSource(url);
  es.onmessage = onEvent;
  es.onerror = () => {
    onError?.();
    es.close();
  };
  return () => es.close();
}