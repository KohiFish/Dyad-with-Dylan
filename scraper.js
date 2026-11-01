const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeGrades({ districtUrl, username, password }) {
    const browser = await puppeteer.launch({ headless: true });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(districtUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('#LogOnModel_Username', { timeout: 30000 });
        await page.type('#LogOnModel_Username', username);
        await page.type('#LogOnModel_Password', password);

        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ]);

        const gradesData = await page.evaluate(() => {
            const parsedClasses = [];
            const classElements = document.querySelectorAll('.sg-main-content .sg-header-heading');

            classElements.forEach((el) => {
                const className = el.innerText.trim();
                if (className) {
                    parsedClasses.push({ className });
                }
            });

            return parsedClasses;
        });

        return { success: true, data: gradesData };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

async function main() {
    const [, , districtUrl, username, password] = process.argv;

    if (!districtUrl || !username || !password) {
        console.error('Usage: node scraper.js <district-url> <username> <password>');
        process.exit(1);
    }

    const result = await scrapeGrades({ districtUrl, username, password });
    console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { scrapeGrades };
