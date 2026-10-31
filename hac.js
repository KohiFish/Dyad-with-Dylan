const cheerio = require('cheerio');

async function fetchGrades(fetchFn, baseUrl, user, pass) {
  const loginUrl = `${baseUrl}/HomeAccess/Account/LogOn`;

  const res = await fetchFn(loginUrl);
  const $ = cheerio.load(await res.text());
  const form = new URLSearchParams();
  $('form input[name]').each((_, el) => {
    form.set($(el).attr('name'), $(el).attr('value') ?? '');
  });

  form.set('LogOnDetails.UserName', user);
  form.set('LogOnDetails.Password', pass);

  const login = await fetchFn(loginUrl, {
    method: 'POST',
    body: form,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (login.url.includes('LogOn')) throw new Error('Login failed');

  const page = await fetchFn(`${baseUrl}/HomeAccess/Content/Student/Assignments.aspx`);
  const $$ = cheerio.load(await page.text());

  const classes = [];
  $$('.AssignmentClass').each((_, c) => {
    const name = $$(c).find('.sg-header-heading').first().text().trim();
    const assignments = [];
    $$(c).find('table.sg-asp-table tr.sg-asp-table-data-row').each((_, row) => {
      const cells = $$(row).find('td').map((_, td) => $$(td).text().trim()).get();
      assignments.push(cells); // map to {name, category, earned, possible} once you see real data
    });
    classes.push({ name, assignments });
  });
  return classes;
}

module.exports = { fetchGrades };