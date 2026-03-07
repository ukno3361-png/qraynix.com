const https = require('https');

const candidates = [
  // extinct / vanish
  'extiq', 'extyn', 'extix', 'extra', 'vaniq', 'vanix', 'vanyx', 'vanzo', 'vantex', 'vantra',
  // symbiont / symbiotic
  'symva', 'symvo', 'symvi', 'symix', 'symex', 'symora', 'symorax', 'symbiox', 'symbit', 'symtic',
  // rejected
  'rejex', 'rejix', 'rejic', 'rejent', 'rejora', 'rejova', 'rejyx', 'rejecta', 'rejecto', 'rejekt',
  // mixed compact variants
  'vanbio', 'extbio', 'symvan', 'symrej', 'vanrej', 'exvan', 'symnix', 'vansym', 'rejvan', 'extsym'
];

const getStatus = (name) => new Promise((resolve) => {
  const req = https.get(`https://rdap.verisign.com/com/v1/domain/${name}.com`, { timeout: 12000 }, (res) => {
    res.resume();
    const code = res.statusCode || 0;
    resolve({ domain: `${name}.com`, status: code, state: code === 404 ? 'likely-available' : code === 200 ? 'registered' : 'unknown' });
  });
  req.on('timeout', () => { req.destroy(); resolve({ domain: `${name}.com`, status: 0, state: 'unknown' }); });
  req.on('error', () => resolve({ domain: `${name}.com`, status: 0, state: 'unknown' }));
});

(async () => {
  const results = [];
  for (const name of candidates) {
    results.push(await getStatus(name));
  }
  console.log(JSON.stringify(results, null, 2));
})();
