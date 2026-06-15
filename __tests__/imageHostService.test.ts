import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildImageHostProxyUrl, 上传DataUrl到图床 } from '../services/imageHostService';

describe('imageHostService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('builds a stable file url when upload response only returns a file id', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            success: true,
            file: {
                id: 'abc 123',
                size: 12,
                storage: 'telegram'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })));

        const result = await 上传DataUrl到图床('data:image/png;base64,aGVsbG8=');

        expect(result).toMatchObject({
            url: 'https://image1.bacon159.pp.ua/api/v1/file/abc%20123',
            id: 'abc 123',
            size: 12,
            storage: 'telegram'
        });
    });

    it('keeps same-origin proxy paths on web origins', () => {
        const originalWindow = globalThis.window;
        vi.stubGlobal('window', {
            location: {
                protocol: 'https:',
                hostname: 'msjh.bacon159.pp.ua'
            }
        });

        const url = buildImageHostProxyUrl('/api/image-host/upload');
        expect(url).toMatch(/\/api\/image-host\/upload$/);

        vi.stubGlobal('window', originalWindow);
    });

    it('includes upload diagnostics when the image host rejects a request', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            success: false,
            error: 'error code: 1102',
            requestId: 'imgup_test',
            upstreamStatus: 500
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Moran-Image-Proxy-Request-Id': 'imgup_test',
                'X-Moran-Image-Upstream-Status': '500'
            }
        })));

        await expect(上传DataUrl到图床('data:image/png;base64,aGVsbG8=', { maxAttempts: 1 })).rejects.toThrow(/TG图床上游暂时不可用：HTTP 500.*请求ID imgup_test/);
    });

    it('retries transient image host upload failures', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({
                success: false,
                error: { message: 'Network error while uploading to Telegram.' }
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                success: true,
                file: {
                    id: 'retry-ok',
                    size: 12,
                    storage: 'telegram'
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        vi.stubGlobal('fetch', fetchMock);
        vi.useFakeTimers();
        try {
            const resultPromise = 上传DataUrl到图床('data:image/png;base64,aGVsbG8=', { maxAttempts: 2 });
            await vi.advanceTimersByTimeAsync(1200);
            await expect(resultPromise).resolves.toMatchObject({
                url: 'https://image1.bacon159.pp.ua/api/v1/file/retry-ok'
            });
            expect(fetchMock).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });
});
