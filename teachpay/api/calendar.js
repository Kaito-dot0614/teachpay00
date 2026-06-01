export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.VITE_CALENDAR_ID;

  if(!email) return res.status(500).json({error:'GOOGLE_SERVICE_ACCOUNT_EMAIL not set'});
  if(!key) return res.status(500).json({error:'GOOGLE_PRIVATE_KEY not set'});
  if(!calendarId) return res.status(500).json({error:'VITE_CALENDAR_ID not set'});

  try {
    const token = await getAccessToken(email, key);
    if(!token) return res.status(500).json({error:'Failed to get access token'});

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString();
    const threeMonthsLater = new Date(now.getFullYear(), now.getMonth()+3, 1).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${oneMonthAgo}&timeMax=${threeMonthsLater}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if(data.error) return res.status(500).json({error: data.error});

    const events = (data.items || []).map(e => ({
      id: e.id,
      title: e.summary || '',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      description: e.description || '',
    }));

    res.status(200).json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}

async function getAccessToken(email, privateKey) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = btoa(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${claim}`;
  const signature = await signRS256(signingInput, privateKey);
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth2:grant_type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function signRS256(input, privateKeyPem) {
  const pemBody = privateKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
