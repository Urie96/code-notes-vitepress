import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import fg from 'fast-glob';
import fs from 'fs';

const filePathList = await fg('./docs/**/*.md')
const getLink = (str) => {
  return str.substring('./docs'.length, str.length - '.md'.length) + '.html'
}
const links = filePathList.map((path) => {
  return {
    url: getLink(path),
  }
})

// Create a stream to write to
const stream = new SitemapStream({ hostname: 'https://lubui.com' })

// Return a promise that resolves with your XML string
const sitemapXml = await streamToPromise(Readable.from(links).pipe(stream))

fs.writeFileSync('dist/sitemap.xml', sitemapXml)