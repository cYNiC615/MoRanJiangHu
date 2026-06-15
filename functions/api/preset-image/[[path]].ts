const encoder = new TextEncoder();
const PRESET_IMAGE_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};
const PRESET_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PRESET_IMAGE_ERROR_CACHE_CONTROL = 'public, max-age=60';
const PRESET_IMAGE_PATTERN = /^s3_[0-9]+_[0-9a-z]+\.(png|jpe?g|webp|gif|bmp)$/i;

const readEnvString = (env: any, name: string, fallback = ''): string => (
    typeof env?.[name] === 'string' && env[name].trim() ? env[name].trim() : fallback
);

const normalizeObjectKey = (value: string): string => (
    value.replace(/^\/+/, '').replace(/\/+/g, '/')
);

const encodeS3Path = (value: string): string => value
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('/');

const bytesToHex = (bytes: ArrayBuffer): string => (
    Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('')
);

const sha256Hex = async (data: string): Promise<string> => (
    bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(data)))
);

const hmac = async (key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> => {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
};

const deriveSigningKey = async (secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> => {
    const kDate = await hmac(encoder.encode(`AWS4${secretKey}`), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    return hmac(kService, 'aws4_request');
};

const formatAmzDate = (date: Date): { amzDate: string; dateStamp: string } => {
    const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};

const buildSignedObjectUrl = async (
    env: any,
    key: string,
    expiresSeconds = 1800,
    method: 'GET' | 'HEAD' = 'GET'
): Promise<string> => {
    const endpoint = readEnvString(env, 'MORAN_OSS_ENDPOINT', 'https://s3.hi168.com').replace(/\/+$/, '');
    const bucket = readEnvString(env, 'MORAN_OSS_BUCKET');
    const accessKey = readEnvString(env, 'MORAN_OSS_ACCESS_KEY');
    const secretKey = readEnvString(env, 'MORAN_OSS_SECRET_KEY');
    const region = readEnvString(env, 'MORAN_OSS_REGION', 'auto');
    const service = 's3';
    if (!bucket || !accessKey || !secretKey) throw new Error('Preset image object storage credentials are not configured');

    const target = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeS3Path(normalizeObjectKey(key))}`);
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    target.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    target.searchParams.set('X-Amz-Credential', `${accessKey}/${credentialScope}`);
    target.searchParams.set('X-Amz-Date', amzDate);
    target.searchParams.set('X-Amz-Expires', String(Math.max(60, Math.min(604800, expiresSeconds))));
    target.searchParams.set('X-Amz-SignedHeaders', 'host');

    const canonicalQuery = Array.from(target.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .join('&');
    const canonicalRequest = [
        method,
        target.pathname,
        canonicalQuery,
        `host:${target.host}\n`,
        'host',
        'UNSIGNED-PAYLOAD'
    ].join('\n');
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        await sha256Hex(canonicalRequest)
    ].join('\n');
    const signingKey = await deriveSigningKey(secretKey, dateStamp, region, service);
    const signature = bytesToHex(await hmac(signingKey, stringToSign));
    target.searchParams.set('X-Amz-Signature', signature);
    return target.toString();
};

const readPresetImageKey = (request: Request, params: any): string => {
    const rawParam = Array.isArray(params?.path)
        ? params.path.join('/')
        : typeof params?.path === 'string'
            ? params.path
            : '';
    const rawPath = rawParam || new URL(request.url).pathname.replace(/^\/api\/preset-image\/?/i, '');
    const decoded = decodeURIComponent(rawPath).replace(/^\/+/, '');
    if (!PRESET_IMAGE_PATTERN.test(decoded)) {
        throw new Error('Preset image key is invalid');
    }
    return normalizeObjectKey(decoded);
};

const buildErrorResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': PRESET_IMAGE_ERROR_CACHE_CONTROL,
            ...PRESET_IMAGE_CORS_HEADERS
        }
    })
);

const buildPresetImageResponse = async (
    context: any,
    method: 'GET' | 'HEAD'
): Promise<Response> => {
    const { request, env } = context;
    try {
        const key = readPresetImageKey(request, context.params);
        const cache = method === 'GET' && typeof caches !== 'undefined' ? caches.default : null;
        const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
        if (cache) {
            const cached = await cache.match(cacheKey);
            if (cached) {
                const headers = new Headers(cached.headers);
                headers.set('X-Moran-Preset-Image-Cache', 'hit');
                return method === 'HEAD'
                    ? new Response(null, { status: cached.status, statusText: cached.statusText, headers })
                    : new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
            }
        }

        const signedUrl = await buildSignedObjectUrl(env, key, 1800, 'GET');
        const upstream = await fetch(signedUrl, {
            method: 'GET',
            headers: {
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        if (!upstream.ok) {
            return buildErrorResponse(`Preset image not found: ${upstream.status}`, upstream.status);
        }

        const headers = new Headers();
        const contentType = upstream.headers.get('Content-Type') || '';
        if (contentType) headers.set('Content-Type', contentType);
        const contentLength = upstream.headers.get('Content-Length');
        if (contentLength) headers.set('Content-Length', contentLength);
        const etag = upstream.headers.get('ETag');
        if (etag) headers.set('ETag', etag);
        const lastModified = upstream.headers.get('Last-Modified');
        if (lastModified) headers.set('Last-Modified', lastModified);
        headers.set('Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('Cloudflare-CDN-Cache-Control', PRESET_IMAGE_CACHE_CONTROL);
        headers.set('X-Moran-Preset-Image-Cache', 'miss');
        Object.entries(PRESET_IMAGE_CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));

        const response = new Response(method === 'HEAD' ? null : upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers
        });
        if (cache && method === 'GET') {
            context.waitUntil?.(cache.put(cacheKey, response.clone()));
        }
        return response;
    } catch (error: any) {
        return buildErrorResponse(error?.message || 'Preset image proxy failed', 502);
    }
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: PRESET_IMAGE_CORS_HEADERS });
}

export const onRequestGet = (context: any): Promise<Response> => buildPresetImageResponse(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => buildPresetImageResponse(context, 'HEAD');
