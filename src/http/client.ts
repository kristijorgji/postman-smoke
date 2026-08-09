export async function apiFetch(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: Buffer | string | null,
): Promise<{ status: number; text: string }> {
    const init: RequestInit = {
        method,
        headers,
    };
    if (body !== null && body !== undefined && method !== 'GET' && method !== 'HEAD') {
        init.body = body;
    }

    const res = await fetch(url, init);
    const text = await res.text();
    return { status: res.status, text };
}
