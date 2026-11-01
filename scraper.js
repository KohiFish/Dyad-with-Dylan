import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function scrapeGrades() {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const districtUrl = document.getElementById('district-url').value;
  await page.goto(districtUrl, {waitUntil: 'networkidle2'});

  await page.waitForSelector('#LogOnModel_UserName');
  await page.type('#LogOnModel_UserName', 'your_student_id');
  await page.type ('#LogOnModel_Password', 'your_secret_password');

  await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({waitUntil: 'networkidle2'})
]);

const gradesData = await page.evaluate(() => {
    const parsedClasses = [];
    const classElement = document.querySelectorAll('.sg-main-content .sg-header-heading');
    classElement.forEach((el) => {
      const className = el.innerText.trim();
      parsedClasses.push({ className });
    })
    return parsedClasses;
});
console.log('Parsed Classes: gradesData');
await browser.close();
}
scrapeGrades();