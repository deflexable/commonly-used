import cors from 'cors';
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import http from "http";
import { readFileSync } from "node:fs";
import { SSO_HTML_CONTENT } from './sso.html';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const ERROR_LOG_DIR = resolve(process.cwd(), './.rendered-error');

await new Promise((success, reject) => {
    if (!globalThis.__initedSSO_Config) {
        let HTML_CONTENT = SSO_HTML_CONTENT;

        [
            ['<ENV.WEB_BASE_URL>', process.env.NEXT_PUBLIC_WEB_BASE_URL],
            ['<ENV.SSO_AUTH_URL>', process.env.NEXT_PUBLIC_SSO_AUTH_URL]
        ].forEach(([v, r]) => {
            HTML_CONTENT = HTML_CONTENT.split(v).join(r);
        });

        const fingerprint = getHashedHex(HTML_CONTENT, 'md5');
        const favicon = readFileSync(resolve(process.cwd(), './public/favicon.ico'));

        const server = http.createServer((req, res) => {
            cors({
                origin: [
                    process.env.NEXT_PUBLIC_WEB_BASE_URL,
                    process.env.NEXT_PUBLIC_SSO_AUTH_URL
                ]
            })(req, res, (err) => {
                if (process.env.NODE_ENV === 'development')
                    console.log('accessing sso:', req.url);

                if (err) {
                    console.error('cors err:', err);
                    res.end();
                    return;
                }

                if (req.url === '/favicon.ico') {
                    res.writeHead(200, {
                        "Content-Type": "image/x-icon",
                    });

                    res.end(favicon);
                    return;
                }

                if (req.url?.startsWith?.('/list_errors?')) {
                    const query = new URLSearchParams(req.url.split('?').slice(1).join('?'));

                    const id = query.get('pass');

                    const safeParse = (o) => {
                        try {
                            return JSON.parse(o);
                        } catch (error) {
                            return { parseError: `${o}` };
                        }
                    }

                    if (process.env.DEVELOPER_PASSKEY === id) {
                        readdir(ERROR_LOG_DIR, 'utf8').then(async l => {
                            let start = (query.get('start') || undefined) * 1;
                            let end = (query.get('end') || undefined) * 1;

                            if (!Number.isInteger(start) || !Number.isInteger(end)) {
                                start = 0;
                                end = l.length;
                            }

                            const p =
                                Object.fromEntries(
                                    await Promise.all(
                                        l.slice(start, end).map(async v => {
                                            const data =
                                                await readFile(resolve(ERROR_LOG_DIR, './' + v), 'utf8')
                                                    .catch(() => '');
                                            return [v, safeParse(data || '{}')];
                                        })
                                    )
                                );
                            const blobData = JSON.stringify({ total: l.length, data: p });

                            res.writeHead(200, {
                                "Content-Type": "application/json",
                            });

                            res.end(blobData);
                        }).catch(e => {
                            res.writeHead(500, {
                                "Content-Type": "text/plain",
                            });

                            res.end(`Error: ${e}`);
                        });
                        return;
                    }
                }

                if (req.url === '/log_critical_error') {
                    const body_list = [];

                    req.on('data', chunk => {
                        body_list.push(chunk);
                    });

                    req.on('end', () => {
                        mkdir(ERROR_LOG_DIR, { recursive: true }).finally(() => {
                            const data = JSON.stringify({
                                date: new Date().toLocaleString?.(),
                                time: Date.now(),
                                headers: req.headers,
                                info: JSON.parse(body_list.join(''))
                            });

                            return writeFile(join(ERROR_LOG_DIR, `${Date.now()}.txt`), data, 'utf8');
                        });

                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                        });

                        res.end('OK');
                    });
                    return;
                }

                if (req.url === '/robots.txt') {
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                    });

                    res.end(`User-agent: *\nDisallow: /`);
                    return;
                }

                if (req.url === `/${fingerprint}.html`) {
                    res.writeHead(200, {
                        'Content-Type': 'text/html',
                        'Cache-Control': 'public, max-age=31536000, immutable'
                    });

                    res.end(HTML_CONTENT);
                    return;
                }

                if (process.env.NODE_ENV === 'development') {
                    res.writeHead(404);
                } else res.writeHead(302, { Location: process.env.NEXT_PUBLIC_WEB_BASE_URL });
                res.end();
            });
        });

        server.listen(process.env.SSO_AUTH_PORT, () => {
            console.log(`sso auth listening at port ${process.env.SSO_AUTH_PORT}, please visit ${process.env.NEXT_PUBLIC_SSO_AUTH_URL}`);
            success();
        });

        server.on('error', err => {
            if (err?.code === 'EADDRINUSE') {
                console.warn('SSO already listening, skipping...');
                success();
                return;
            }

            console.log('sso server err:', err);
            reject(err);
        });

        console.log('sso_auth fingerprint:', fingerprint);
        globalThis.ssoFingerprint = fingerprint;
        globalThis.__initedSSO_Config = true;

        function getHashedHex(txt = '', algo) {
            const hash = createHash(algo || 'sha256');
            hash.update(txt);
            return hash.digest('hex');
        }
    } else success();
});