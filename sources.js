import * as cheerio from "cheerio"

/* ---- DATE PARSER ----- */
import * as chrono from "chrono-node"
import * as chronoFR from "chrono-node/fr" // add french support

export default [
  {
    id: "afis-editos",
    url: "https://afis.org/-Editos-",
    method: "rawHttp",
    parse: (html) => {
      const $ = cheerio.load(html)
      const items = []
      $(".article-de-liste").each((i, e) => {
        const title = $(e).find("h3 > a").text().trim()
        const date = chronoFR.parseDate(
          $(e).find("small").text().trim().split("\n")[0]
        )
        const url =
          "https://afis.org/" + $(e).find("h3 > a").attr("href").trim()
        const description = $(e).find("p").text().trim()
        const image = "https://afis.org/" + $(e).find("img").attr("src")
        items.push({ title, date, url, description, image })
      })
      return items
    },
  },
  {
    id: "lille-aeronef-agenda",
    url: "https://aeronef.fr/agenda?page=1",
    method: "rawHttp",
    parse: (html) => {
      const $ = cheerio.load(html)
      const items = []
      const reverseOrder = []
      $(".views-row").each((i, e) => {
        reverseOrder.push(e)
      })
      for (let i = 0; i < reverseOrder.length; i++) {
        const e = reverseOrder[i]

        const targetDate = $(e).find(".evt-date").text().trim()
        const title = $(e).find(".agenda--title").text().trim()
        if (!title) continue
        const url = $(e).find("a").attr("href")
        const description = $(e).find(".agenda-item-description").text().trim()
        const image = $(e).find("img").attr("src") || "#"
        items.push({
          title: `${title} - ${targetDate}`,
          date: new Date(),
          url,
          description: title,
          image,
          sortRank: new Date(chronoFR.parseDate(targetDate)).getTime() || i,
        })
      }
      items.sort((a, b) => a.sortRank - b.sortRank)
      return items
    },
  },
]
