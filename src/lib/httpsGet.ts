import https from 'node:https';

/**
 * Robust JSON fetcher using Node's native https client with TLS compatibility flags.
 * Fixes Windows OpenSSL 3.x / undici ECONNRESET issues with Open-Meteo Cloudflare edge servers.
 */
export function httpsGetJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        ciphers: 'DEFAULT@SECLEVEL=1',
        headers: {
          'User-Agent': 'AirWise-App/1.0 (https://github.com/suvanginihalder-oss/airwise)',
          Accept: 'application/json'
        }
      },
      (res) => {
        const { statusCode } = res;
        if (!statusCode || statusCode < 200 || statusCode >= 300) {
          res.resume();
          return reject(new Error(`HTTPS GET failed with status code ${statusCode}`));
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
            reject(new Error(`Failed to parse JSON response: ${e instanceof Error ? e.message : String(e)}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(12000, () => {
      req.destroy(new Error(`HTTPS GET timed out for ${url}`));
    });
  });
}
