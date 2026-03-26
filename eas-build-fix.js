/**
 * Trigger EAS Build from GitHub via Expo GraphQL API
 * Bypasses Windows tar permissions bug entirely
 */
const https = require('https');

const TOKEN = process.env.EXPO_TOKEN || 'juj68aSnvfC1eyx5YHSGiLUBNtsTHqtZF8bXm9ic';
const APP_ID = 'c8c9bd08-506e-46ae-87fe-de09dacac100';

// Step 1: Find available build-related mutations via introspection
function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error: ' + body.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Step 1: Get GitHubBuildInput structure
  console.log('🔍 Introspection de GitHubBuildInput...\n');
  const r = await graphql(`{
    __type(name: "GitHubBuildInput") {
      inputFields {
        name
        type { name kind ofType { name kind ofType { name } } }
      }
    }
  }`);
  
  if (r.errors) {
    console.error('Erreur:', JSON.stringify(r.errors, null, 2));
    return;
  }
  
  const fields = r.data?.__type?.inputFields || [];
  console.log('GitHubBuildInput fields:');
  fields.forEach(f => {
    const t = f.type?.name || f.type?.ofType?.name || f.type?.ofType?.ofType?.name || JSON.stringify(f.type);
    console.log(`  - ${f.name}: ${t} (${f.type?.kind})`);
  });
  
  // Step 2: Trigger the build
  console.log('\n🚀 Déclenchement du build GitHub...');
  const buildResult = await graphql(`
    mutation {
      githubApp {
        createGitHubBuild(buildInput: {
          appId: "${APP_ID}"
          platform: ANDROID
          buildProfile: "preview"
          gitRef: "main"
        }) {
          id
        }
      }
    }
  `);
  
  if (buildResult.errors) {
    console.error('❌ Erreur:', JSON.stringify(buildResult.errors, null, 2));
  } else {
    const receipt = buildResult.data?.githubApp?.createGitHubBuild;
    console.log('✅ Build déclenché!');
    console.log('📋 Résultat:', JSON.stringify(receipt, null, 2));
    console.log(`\n🔗 Dashboard: https://expo.dev/accounts/sialou1/projects/loveapp2026/builds`);
  }
}

main().catch(e => console.error('❌', e.message));
