export async function fetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignored: Fallback to standard error message
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
