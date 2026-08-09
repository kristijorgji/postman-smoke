export type Classification = 'OK' | 'EXPECTED_4XX' | 'WARN' | 'FAIL' | 'SKIP';

export interface FlattenedRequest {
    key: string;
    name: string;
    method: string;
    rawUrl: string;
    headers: Record<string, string>;
    body: string | null;
}

export interface CollectionItem {
    name?: string;
    item?: CollectionItem[];
    request?: {
        method?: string;
        header?: Array<{ key?: string; value?: string; disabled?: boolean }>;
        body?: {
            mode?: string;
            raw?: string;
            urlencoded?: Array<{ key?: string; value?: string }>;
        };
        url?: string | { raw?: string };
        auth?: { type?: string };
    };
}

export function pathKey(folder: string, name: string): string {
    return folder ? `${folder}/${name}` : name;
}

export function flattenCollection(items: CollectionItem[], folder = ''): FlattenedRequest[] {
    const out: FlattenedRequest[] = [];

    for (const it of items) {
        const name = it.name ?? '';
        const key = pathKey(folder, name);
        if (it.item) {
            out.push(...flattenCollection(it.item, key));
            continue;
        }
        const req = it.request;
        if (!req) {
            continue;
        }
        const method = (req.method ?? 'GET').toUpperCase();
        const rawUrl = typeof req.url === 'string' ? req.url : (req.url?.raw ?? '');
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };
        for (const h of req.header ?? []) {
            if (h.disabled || !h.key) {
                continue;
            }
            headers[h.key] = h.value ?? '';
        }
        let body: string | null = null;
        if (req.body?.mode === 'raw' && req.body.raw) {
            body = req.body.raw;
        } else if (req.body?.mode === 'urlencoded' && req.body.urlencoded) {
            const pairs: Array<[string, string]> = req.body.urlencoded.map(p => [p.key ?? '', p.value ?? '']);
            body = new URLSearchParams(pairs).toString();
            headers['Content-Type'] = headers['Content-Type'] ?? 'application/x-www-form-urlencoded';
        }
        out.push({ key, name: key, method, rawUrl, headers, body });
    }

    return out;
}
