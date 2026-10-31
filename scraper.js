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



