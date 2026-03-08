const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const fs = require('fs');

async function deployRules() {
  const rules = fs.readFileSync('./database.rules.json', 'utf8');

  const auth = new GoogleAuth({
    keyFile: './h-couple-firebase-adminsdk.json',
    scopes: ['https://www.googleapis.com/auth/firebase.database']
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  console.log('Access token obtained, deploying rules...');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'h-couple-default-rtdb.firebaseio.com',
      path: '/.settings/rules.json?access_token=' + token,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Rules deployed successfully!');
          resolve();
        } else {
          console.error('Deploy failed:', res.statusCode, data);
          reject(new Error(data));
        }
      });
    });
    req.write(rules);
    req.end();
  });
}

deployRules().catch(err => { console.error(err); process.exit(1); });
