import fs from 'fs';
import fg from 'fast-glob';
import brotli from 'brotli';
import chalk from 'chalk';
import zlib from 'zlib';

const pattern = './dist/**/*.{js,css,json,svg,html,cast}';
const threshold = 1024 * 5;

const files = await fg(pattern);

files.forEach((file) => {
  fs.readFile(file, (err, src) => {
    if (src.length > threshold) {
      // const brFileName = `${file}.br`;
      const gzFileName = `${file}.gz`;
      // const brzip = brotli.compress(src, { mode: 1 });
      const gzip = zlib.gzipSync(src);
      // printProfitInfo(brFileName, src.length, brzip.length);
      // printProfitInfo(gzFileName, src.length, gzip.length);
      // fs.writeFile(brFileName, brzip, () => {});
      fs.writeFile(gzFileName, gzip, () => {});
    }
  });
});

function printProfitInfo(filePath, inBytes, outBytes) {
  var profitPercents = 100 - (outBytes * 100) / inBytes;
  console.log(
    `${chalk.blue(filePath)} : ${
      Math.round((inBytes / 1024) * 1000) / 1000
    } KiB${profitPercents < 0 ? ' + ' : ' - '}${chalk.green(
      `${Math.abs(Math.round(profitPercents * 10) / 10)}%`
    )} = ${Math.round((outBytes / 1024) * 1000) / 1000} KiB`
  );
}
