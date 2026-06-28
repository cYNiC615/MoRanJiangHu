import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const 读取请求体 = async (req: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const 执行图片代理请求 = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: Buffer
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> => {
  const upstreamHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    if (/^(host|content-length|connection|accept-encoding)$/i.test(key)) return;
    upstreamHeaders.set(key, value);
  });

  const response = await fetch(url, {
    method: method.toUpperCase(),
    headers: upstreamHeaders,
    body: body.length ? body : undefined
  });
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    headers: responseHeaders,
    body: Buffer.from(await response.arrayBuffer())
  };
};

const isAllowedComfyProxyTarget = (value: string): boolean => {
  try {
    const url = new URL(value);
    return /^https?:$/i.test(url.protocol)
      && (
        /(^|\.)cnb\.run$/i.test(url.hostname)
        || /(^|\.)cnb\.space$/i.test(url.hostname)
        || process.env.CNB_SYNC_ALLOW_ANY_URL === 'true'
      );
  } catch {
    return false;
  }
};

const handleComfyUiProxyRequest = async (
  req: any,
  res: any,
  next: () => void,
  logger: { error: (message: string) => void }
) => {
  if (!req.url) {
    next();
    return;
  }

  if (String(req.method || '').toUpperCase() === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  try {
    const requestUrl = new URL(req.url, 'http://local-comfy-proxy');
    const targetBase = String(requestUrl.searchParams.get('url') || '').trim().replace(/\/+$/, '');
    if (!targetBase || !isAllowedComfyProxyTarget(targetBase)) {
      res.statusCode = 400;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'ComfyUI proxy target URL is invalid or not allowed.' }));
      return;
    }

    const proxyPrefix = '/api/image-backend/comfyui-proxy';
    const pathPart = requestUrl.pathname.startsWith(proxyPrefix)
      ? requestUrl.pathname.slice(proxyPrefix.length) || '/'
      : requestUrl.pathname || '/';
    const target = new URL(targetBase);
    target.pathname = `${target.pathname.replace(/\/+$/, '')}/${pathPart.replace(/^\/+/, '')}`;
    target.search = '';
    requestUrl.searchParams.forEach((value, key) => {
      if (key !== 'url') target.searchParams.append(key, value);
    });

    const method = String(req.method || 'GET').toUpperCase();
    const body = method === 'GET' ? Buffer.alloc(0) : await 读取请求体(req);
    const headers: Record<string, string> = {};
    const contentType = req.headers['content-type'];
    const authorization = req.headers.authorization;
    const accept = req.headers.accept;
    if (typeof contentType === 'string' && contentType.trim()) headers['content-type'] = contentType;
    if (typeof authorization === 'string' && authorization.trim()) headers.authorization = authorization;
    if (typeof accept === 'string' && accept.trim()) headers.accept = accept;

    const result = await 执行图片代理请求(target.toString(), method, headers, body);
    res.statusCode = result.status;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    Object.entries(result.headers).forEach(([key, value]) => {
      if (key.toLowerCase() === 'content-length') return;
      res.setHeader(key, value);
    });
    res.end(result.body);
  } catch (error: any) {
    logger.error(`[comfyui-dev-proxy] ${error?.message || error}`);
    res.statusCode = 502;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: 'ComfyUI dev proxy failed',
      detail: error?.message || String(error)
    }));
  }
};

const imageDevProxyPlugin = (): Plugin => ({
  name: 'image-dev-proxy',
  configurePreviewServer(server) {
    server.middlewares.use('/api/image-backend/comfyui-proxy', async (req, res, next) => {
      await handleComfyUiProxyRequest(req, res, next, server.config.logger);
    });
  },
  configureServer(server) {
    server.middlewares.use('/api/image-backend/comfyui-proxy', async (req, res, next) => {
      await handleComfyUiProxyRequest(req, res, next, server.config.logger);
    });
  }
});

const stripSameOriginAssetCrossoriginPlugin = (): Plugin => ({
  name: 'strip-same-origin-asset-crossorigin',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      /(<(?:script|link)\b(?=[^>]*(?:src|href)="\/assets\/)[^>]*)\s+crossorigin(?=[\s>])/g,
      '$1'
    );
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const productionBase = env.VITE_BASE_PATH || '/';
  return {
    base: mode === 'production' ? productionBase : '/',
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    plugins: [react(), imageDevProxyPlugin(), stripSameOriginAssetCrossoriginPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    build: {
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
 
            if (normalizedId.includes('/node_modules/')) {
              if (
                normalizedId.includes('/react/') ||
                normalizedId.includes('/react-dom/') ||
                normalizedId.includes('/scheduler/')
              ) {
                return 'react-vendor';
              }
              if (normalizedId.includes('/fflate/')) {
                return 'fflate-vendor';
              }
              if (normalizedId.includes('/@google/genai/')) {
                return 'ai-sdk-vendor';
              }
              return 'vendor';
            }
 
            if (
              normalizedId.endsWith('/data/structuredItemLibrary.ts') ||
              normalizedId.endsWith('/data/presetItemImages.ts')
            ) {
              return 'item-library';
            }

            if (normalizedId.includes('/prompts/')) {
              return 'prompts';
            }
          }
}
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      exclude: [
        'node_modules/**',
        'dist/**',
        '.tmp*/**',
        'test-results/**',
        'tests/e2e-*.spec.mjs',
        'tests/bugfix-*.spec.mjs',
        'tests/battle-*.spec.mjs',
        'tests/dialogue-*.spec.mjs',
        'tests/save-*.spec.mjs'
      ]
    }
  };
});
