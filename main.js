const cheerio = require('cheerio');
const { session } = require('electron');

async function fetchGrades(baseUrl, user, pass) {
  const ses = session.fromPartition('hac');

  const loginPage = await ses.fetch(`${baseUrl}/HomeAccess/Account/LogOn`);
  const $ = cheerio.load(await loginPage.text());
  const token = $('input[name="__RequestVerificationToken"]').val();


  const body = new URLSearchParams({
    __RequestVerificationToken: token,
    'LogOnDetails.UserName': user,
    'LogOnDetails.Password': pass,
  });
  await ses.fetch(`${baseUrl}/HomeAccess/Account/LogOn`, { method: 'POST', body });

  const page = await ses.fetch(`${baseUrl}/HomeAccess/Content/Student/Assignments.aspx`);
  const $$ = cheerio.load(await page.text());
}
