/* Authored by Owen Larsen */

// Imports
const { chromium } = require("playwright");

/**
 * Checks to see if the first 100 articles on Hacker News/newest (https://news.ycombinator.com/newest) are correctly sorted from newest to oldest.
 */
async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  // instantiate our looping variables
  let valid = true; // if the order has been violated or not
  let currentCheck = 0; // What number of articles we've checked

  // loop through pages until we've verified the first 100 pages are sorted from newest to oldest
  while (currentCheck < 100 && valid) {

    // locate all instances of class "age" on this page and retrieve their dates posted
    const ageLocator = page.locator(".age");
    let timestamps = await ageLocator.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("title"))
    );

    // parse the timestamps as Date objects
    timestamps = timestamps.map((timestamp) => {
      // sanitize the timestamp (removing the extra unix epoch number), then parse
      const sanitizedTimestamp = timestamp.split(" ")[0];
      const date = new Date(sanitizedTimestamp);
      
      // throw an error if this timestamp isn't a valid date
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp: ${timestamp}`);
      }

      return date;
    });

    // verify that the current batch is in order
    currentCheck++; // an extra current check tick, to account for the initial comparison
    for (let i = 1; i < timestamps.length; i++) {
      // console.log(`comparing ${timestamps[i-1]} and ${timestamps[i]}`) // uncomment this line for a more verbose mode
      if (timestamps[i-1] < timestamps[i]) { // if the higher up article is older than the next one down, then they're not sorted
        valid = false;
        break;
      }

      // exit the loop if we've already checked 100
      if (currentCheck >= 100) {
        break;
      }
  
      currentCheck++;
    }

    // check if the "more" button exists, if it does then click it to go to the next page
    const moreButton = page.locator(".morelink");
    if (!(await moreButton.count())) {
      throw new Error('Missing "more" button');
    }
    await moreButton.click();

  }

  // output the results of our test
  if (valid) {
    console.log("The first 100 articles are sorted in order from newest to oldest.")
  } else {
    console.log("THE FIRST 100 ARTICLES ARE NOT SORTED.")
  }

  // close the browser
  await browser.close()
}

(async () => {
  await sortHackerNewsArticles();
})();
