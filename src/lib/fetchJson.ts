import http from 'node:http';
import https from 'node:https';

/**
 * Universal HTTP/HTTPS JSON fetcher.
 * Automatically tries HTTPS first, and falls back to HTTP if a TLS/ECONNRESET
 * network handshake issue occurs (e.g. Windows ISP transparent proxies / middleboxes).
 */
export function fetchJson<T>(url: string): Promise<T> {
  const tryRequest = (targetUrl: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      const isHttps = targetUrl.startsWith('https:');
      const client = isHttps ? https : http;

      const req = client.get(
        targetUrl,
        {
          headers: {
            'User-Agent': 'AirWise/1.0 (Urban Air Quality Assistant)',
            Accept: 'application/json'
          },
          timeout: 10000
        },
        (res) => {
          const { statusCode } = res;
          if (!statusCode || statusCode < 200 || statusCode >= 300) {
            res.resume();
            return reject(new Error(`Request failed with status code ${statusCode}`));
          }

          let rawData = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(rawData);
              resolve(parsed as T);
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`));
            }
          });
        }
      );

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy(new Error(`Request timed out for ${targetUrl}`));
      });
    });
  };

  return tryRequest(url).catch((err) => {
    // If https failed due to connection reset, try http
    if (url.startsWith('https:')) {
      const httpUrl = url.replace('https:', 'http:');
      return tryRequest(httpUrl);
    }
    throw err;
  });
}
