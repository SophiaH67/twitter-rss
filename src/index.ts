import express, { Request, Response } from "express";
import RSS from "rss";
import { Scraper, Tweet } from "@the-convocation/twitter-scraper";

const scraper = new Scraper();
const app = express();

if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
  console.error("TWITTER_USERNAME and TWITTER_PASSWORD must be set");
  process.exit(1);
}

scraper.login(
  process.env.TWITTER_USERNAME,
  process.env.TWITTER_PASSWORD,
  process.env.TWITTER_EMAIL
);

app.get("/:twitter.xml", async (req: Request, res: Response) => {
  const accountName = req.params.twitter;
  const tweets = scraper.getTweets(accountName, 20);

  const feed = new RSS({
    title: `Twitter Feed for ${accountName}`,
    feed_url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    site_url: `https://twitter.com/${accountName}`,
  });

  try {
    for await (const tweet of tweets) {
      feed.item({
        title: tweet.permanentUrl!,
        description: tweet.text!,
        author: tweet.username,
        guid: tweet.id,
        url: `https://twitter.com/${accountName}/status/${tweet.id}`,
        date: new Date(tweet.timestamp! * 1000),
      });
    }
  } catch (e) {
    console.log(e);
    //@ts-expect-error - I do not care
    res.status(500).send(e.message);
    return;
  }

  res.set("Content-Type", "text/xml");
  res.send(feed.xml());
});

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`Server started at http://localhost:${process.env.PORT ?? 3000}`);
});
