import type { FlattenedRequest } from '@src/collection/types';

/** Default leftover ordering: GETs before mutations. Lower runs earlier. */
export function defaultLeftoverScore(req: FlattenedRequest, _substUrl: string): number {
    if (req.method === 'GET' || req.method === 'HEAD') {
        return 100;
    }
    return 200;
}

/**
 * Apply explicit order.json keys first; append remaining via leftoverScore.
 */
export function orderRequests(
    requests: FlattenedRequest[],
    explicitKeys: string[],
    subst: (raw: string) => string,
    leftoverScore: (req: FlattenedRequest, substUrl: string) => number = defaultLeftoverScore,
): FlattenedRequest[] {
    const byKey = new Map(requests.map(r => [r.key, r]));
    const used = new Set<string>();
    const ordered: FlattenedRequest[] = [];

    for (const key of explicitKeys) {
        const req = byKey.get(key);
        if (!req) {
            continue;
        }
        ordered.push(req);
        used.add(key);
    }

    const leftovers = requests
        .filter(r => !used.has(r.key))
        .sort(
            (a, b) =>
                leftoverScore(a, subst(a.rawUrl)) - leftoverScore(b, subst(b.rawUrl)) || a.key.localeCompare(b.key),
        );

    return [...ordered, ...leftovers];
}
