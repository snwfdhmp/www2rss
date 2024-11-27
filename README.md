# www2rss : provide parsing rules, i will run them

This project is born from 2 causes :

1. Some websites do not implement RSS feed, or they are wrongly implemented.
2. Website parsers exist but they are paid or freemium.

This project goal is : **Allow anyone to benefit from a web-to-rss tool without needing to pay**.

I choose to donate bandwidth and compute resource for the community, so that anyone can benefit from it. They cost money, not everyone can afford.

[Help this project benefit everyone](https://github.com/sponsors/snwfdhmp).

## Guide: How it works

Everything you need to know is described here :

1. Edit `sources.js` and add your website URL and parsing rules.
2. The script **runs on my server every hour**.
3. You can add `www2rss.snwfdhmp.com/<sourceId>/rss.xml` to your RSS reader. I'm using [miniflux](https://github.com/miniflux/v2) myself.

## Guide: More details

1. You are expected to be a developer, or get help from a developer. This is no auto-parser.
2. If you don't want to use community servers, you may fork this repo and run it on your servers.

## Guide: How to add a new source

1. Edit the `sources.js` file. I will review it and accept it ASAP.

Example:

```js
{
    id: "afis-editos", // this should be unique accross the whole file
    url: "https://afis.org/-Editos-", // url of page to parse
    method: "rawHttp", // set to 'runJavascript' if needed (ie. if website is not SSR)
    parse: (html) => {
        const $ = cheerio.load(html) // we use cheerio as default to build DOM
        const items = []
        $(".article-item").each((i, e) => { // iterate on items
        const title = $(e).find("h3").text() // find required properties
        const date = chrono.parseDate($(e).find("date")) // parse date: return RFC2822 format. Use chronoFR for FR parser, or add yours.
        const url =
            "https://afis.org/" + $(e).find("a").attr("href") // put url in absolute format: no relative format
        const description = $(e).find("p").text()
        const image = "https://afis.org/" + $(e).find("img").attr("src")

        items.push({ title, date, url, description, image }) // most important line: data should contain {title,date,url,description,image}
        })
        return items
    },
},
```

**IMPORTANT**:

1. Test locally first to ensure minimum of back-and-forth. Clone, edit, run, verify .xml file and then open a pull request.
2. Ensure `id` is unique for your source, otherwise things will break.
3. Add your source **to the end** of the sources.js.
4. In case I'm really long to answer your PR, contact me on discord `mjo___`

## Contributing

1. Open a pull requests. No strict rules, just make your best.
2. Donating helps a lot. [GitHub Sponsors](https://github.com/sponsors/snwfdhmp)
3. Leave a star ⭐️ so it can help more people.
