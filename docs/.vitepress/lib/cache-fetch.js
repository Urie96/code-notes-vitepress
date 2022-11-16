import fs from 'fs';
import MD5 from './md5.js';

const cachePath = (url) => {
    const hash = MD5(url);
    return `./.cache/${hash}`;
};

fs.existsSync('./.cache') || fs.mkdirSync('./.cache');

export default (url) => {
    const path = cachePath(url);
    if (fs.existsSync(path)) {
        return fs.readFileSync(path).toString();
    }
    (async () => {
        const res = await fetch(url);
        const body = await res.text();
        fs.writeFileSync(path, body);
    })();
};
