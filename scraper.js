import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const browser = await puppeteer.launch({headless: true});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const districtUrl = document.getElementById('district-url').value;
await page.goto(districtUrl, {waitUntil: 'networkidle2'});

const username = document.getByElementId('username').value;
const password = document.getByElementId('password').value;

await page.waitForSelector('#LogOnModel_UserName');
await page.type('#LogOnModel_UserName', 'your_student_id');
await page.type ('#LogOnModel_Password', 'your_secret_password');

await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({waitUntil: 'networkidle2'})
]);



const gradesData = await page.evaluate(() => {
    const parsedClasses = [];
    const classes = document.querySelectorAll('.sg-main-content .sg-header-heading');
    return parsedClasses;
});

await broswer.close();
