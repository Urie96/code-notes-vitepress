import fetch from 'node-fetch';
import MD5 from './md5.js';

if (process.argv.length < 3) {
    console.log('Usage: node sync-fetch.js <url>');
    process.exit(1);
}

const tasks = process.argv.slice(2).map(async (url) => {
    const res = await fetch(url);
    const body = await res.text();
    return body;
});

Promise.all(tasks).then((res) => {
    console.log(MD5(JSON.stringify(res)));
});
