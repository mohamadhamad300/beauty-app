const https = require('https');
const options = {
  hostname: 'expo.dev',
  path: '/accounts/mohamad.hamad/projects/beauty-app/builds/4ac1fd44-b57f-4d0f-8267-ac0c2d18af2d',
  headers: { 'Accept': 'application/json' }
};
https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/"buildLogsUrl":"([^"]+)"/);
    if (match) {
      https.get(match[1], (res2) => {
        let logData = '';
        res2.on('data', chunk => logData += chunk);
        res2.on('end', () => console.log(logData.slice(0, 5000)));
      });
    } else {
      // Try to find error message in the page
      const errMatch = data.match(/"message":"([^"]+)"/g);
      if (errMatch) console.log(errMatch.slice(0, 10).join('\n'));
      else console.log('Could not parse page, trying text...');
    }
  });
}).on('error', e => console.log('Error:', e.message));
