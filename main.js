import axios from "axios"
import * as cheerio from "cheerio"
import path from "path"
import RSS from "rss"
import fs from "fs"
import express from "express"
import { XMLParser } from "fast-xml-parser"
import crypto from "crypto"

import sources from "./sources.js"

/* DATA STORE */
const __dirname = new URL(".", import.meta.url).pathname
const DATA_DIR = path.join(__dirname, "data")
const sourceIdToFilePath = (sourceId) => {
  const sha256 = crypto.createHash("sha256")
  sha256.update(sourceId)
  const hash = sha256.digest("hex")
  return path.join(DATA_DIR, `${hash}.xml`)
}
await fs.promises.mkdir(DATA_DIR, { recursive: true })

/* FETCH METHODS */
const FETCH_METHODS = {
  rawHttp: async (url) => {
    const response = await axios.get(url)
    return response.data
  },
  runJavascript: async (url) => {
    throw "Not implemented"
  },
}
const www2html = async (url, method) => {
  if (!FETCH_METHODS[method]) {
    throw "Invalid method"
  }
  return await FETCH_METHODS[method](url)
}

/* RSS MANIPULATION */
const sourceToRssObject = async (source) => {
  const rssObject = new RSS({
    title: source.title || source.id,
    description: source.description || source.id,
    site_url: source.url,
    image_url: await getFaviconOfWebsite(source.url),
    language: source.language || "fr",
    pubDate: new Date(),
  })
  return rssObject
}
const getFaviconOfWebsite = async (websiteUrl) => {
  const response = await axios.get(websiteUrl)
  const $ = cheerio.load(response.data)
  return (
    $("link[rel='icon']").attr("href") ||
    "https://www.google.com/s2/favicons?domain=" + websiteUrl
  )
}

/* SOURCE MANAGEMENT */
const refreshSources = async () => {
  for (const source of sources) {
    const sourceFile = sourceIdToFilePath(source.id)
    let feed = await sourceToRssObject(source)
    if (fs.existsSync(sourceFile)) {
      const rssFeed = fs.readFileSync(sourceFile, "utf8")
      const parser = new XMLParser()
      const parsedFeed = parser.parse(rssFeed)
      // add items
      if (
        parsedFeed.rss &&
        parsedFeed.rss.channel &&
        parsedFeed.rss.channel.item
      ) {
        // if alone
        let items = parsedFeed.rss.channel.item
        if (!Array.isArray(parsedFeed.rss.channel.item)) {
          items = [parsedFeed.rss.channel.item]
        }
        items.forEach((item) => {
          feed.item(item)
        })
      }
    }
    const html = await www2html(source.url, source.method)
    const articles = source.parse(html)
    let countExisting = 0
    let countNew = 0
    for (const article of articles) {
      // if already found (by url)
      if (feed.items.find((item) => item.guid === article.url)) {
        countExisting++
        continue
      }
      countNew++
      feed.item({
        title: article.title,
        url: article.url,
        guid: article.url,
        author: article.author || source.id,
        image: article.image,
        description: article.description,
        date: article.date,
      })
    }
    console.log(
      `Articles from ${source.id}: ${articles.length} (${countNew} new, ${countExisting} existing)`
    )
    await fs.promises.writeFile(sourceFile, feed.xml(), "utf8")
  }
}
refreshSources()
setInterval(refreshSources, 1000 * 60 * 60) // refresh every hour

/* HTTP SERVER */
const PORT = 24712
const app = express()
app.get("/:sourceId/rss.xml", (req, res) => {
  const { sourceId } = req.params
  const rssFilePath = sourceIdToFilePath(sourceId)

  // Vérifie si le fichier RSS existe et le renvoie
  if (fs.existsSync(rssFilePath)) {
    res.set("Content-Type", "application/rss+xml")
    res.set("charset", "utf-8")
    res.sendFile(rssFilePath)
  } else {
    res.status(404).send("Not Found")
  }
})
app.listen(PORT, () => {
  console.log(`RSS server started on port ${PORT}`)
})
