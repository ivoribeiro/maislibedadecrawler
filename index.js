const puppeteer = require('puppeteer');
const { DownloaderHelper } = require('node-downloader-helper');

async function startBrowser() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false });
    const page = await browser.newPage();
    return { browser, page };
}

async function closeBrowser(browser) {
    return browser.close();
}

// Normalizing the text
function getText(linkText) {
    linkText = linkText.replace(/\r\n|\r/g, "\n");
    linkText = linkText.replace(/\ +/g, " ");

    // Replace &nbsp; with a space 
    var nbspPattern = new RegExp(String.fromCharCode(160), "g");
    return linkText.replace(nbspPattern, " ");
}

// find the link, by going over all links on the page
async function findByLink(page, linkString) {
    const links = await page.$$('a')
    for (var i = 0; i < links.length; i++) {
        let valueHandle = await links[i].getProperty('innerText');
        let linkText = await valueHandle.jsonValue();
        const text = getText(linkText);
        if (text.includes(linkString)) {
            console.log("Found");
            return links[i];
        }
    }
    return null;
}

async function iteratebooks(page) {
    const images = await page.$$(".image a");
    let urls = []
    for (var i = 0; i < images.length; i++) {
        let valueHandle = await images[i].getProperty('href');
        let url = await valueHandle.jsonValue();
        urls.push(url)
    }
    for (var i = 0; i < urls.length; i++) {
        await page.goto(urls[i]);
        const result = await findByLink(page, "pdf");
        if (result) {
            const link = await result.getProperty("href");
            let linkText = await link.jsonValue();
            console.log("Downloading", linkText)
            const download = new DownloaderHelper(linkText, __dirname + "/books");
            download.on('end', () => console.log('Download Completed'))
            download.start();
        }
    }
}



async function playTest() {
    const { browser, page } = await startBrowser();
    page.setViewport({ width: 1366, height: 768 });
    let i;
    for (i = 1; i < 20; i++) {
        const url = `https://maisliberdade.pt/biblioteca/page${i}`
        console.log(url)
        await page.goto(url);
        await iteratebooks(page);
    }
    await closeBrowser(browser);
}

(async () => {
    await playTest();
})();