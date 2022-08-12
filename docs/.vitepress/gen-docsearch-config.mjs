import fg from 'fast-glob';

async function main() {
    const filePathList = await fg('./docs/**/*.md')
    const urls = filePathList.filter(v => !v.includes('index.md')).map((str) =>
        "https://lubui.com" + str.substring('./docs'.length, str.length - '.md'.length) + '.html'
    )
    const json = {
        "index_name": "code_notes",
        "start_urls": urls,
        "stop_urls": [],
        "selectors": {
            "lvl0": ".content h1",
            "lvl1": ".content h2",
            "lvl2": ".content h3",
            "lvl3": ".content h4",
            "lvl4": ".content h5",
            "lvl5": ".content h6",
            "text": ".content p, .content li"
        }
    }
    console.log(JSON.stringify(json));
}

main()