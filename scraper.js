const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://home-access.cfisd.net/HomeAccess/Account/LogOn?ReturnUrl=%2fHomeAccess%2f';

const homeAccess = {};

async function homeAccess() {
  
  // 1. Fetch the raw HTML from the website
  const { data } = await axios.get(url);
  
  // 2. Load the HTML into cheerio
  const $ = cheerio.load(data);
  
  // 3. Target the root and output the entire HTML structure
  const wholeHTML = $.html();
  
  console.log(wholeHTML);
}

homeAccess();