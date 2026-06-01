export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.VITE_CALENDAR_ID;
  if(!email) return res.status(500).json({error:'EMAIL not set'});
  if(!key) return res.status(500).json({error:'KEY not set'});
  if(!calendarId) return res.status(500).json({error:'CALENDAR_ID not set'});
  try {
    const token = await getAccessToken(email, key);
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString();
    const max = new Date(now.getFullYear(), now.getMonth()+3, 1).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime`;
    const r = await fetch(url, {headers:{Authorization:`Bearer ${token}`}});
    const d = await r.json();
    if(d.error) return res.status(500).json({error:JSON.stringify(d.error)});
    const events = (d.items||[]).map(e=>({
      id:e.id,
      title:e.summary||'',
      start:e.start?.dateTime||e.start?.date,
      end:e.end?.dateTime||e.end?.date,
      description:e.description||'',
    }));
    res.status(200).json({events});
  } catch(err) {
    res.status(500).json({error:err.message});
  }
}

async function getAccessToken(email, privateKey) {
  const header = btoa(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const now = Math.floor(Date.now()/1000);
  const claim = btoa(JSON.stringify({
    iss:email,
    scope:'https://www.googleapis.com/auth/calendar.readonly',
    aud:'https://oauth2.googleapis.com/token',
    exp:now+3600,
    iat:now,
  }));
  const input = `${header}.${claim}`;
  const sig = await signRS256(input, privateKey);
  const jwt = `${input}.${sig}`;
  const params = new URLSearchParams();
  params.append('grant_type','urn:ietf:params:oauth2:grant_type:jwt-bearer');
  params.append('assertion',jwt);
  const r = await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:params.toString(),
  });
  const d = await r.json();
  if(!d.access_token) throw new Error('Token failed: '+JSON.stringify(d));
  return d.access_token;
}

async function signRS256(input, pem) {
  const body = pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
  const der = Uint8Array.from(atob(body),c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',der.buffer,
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},
    false,['sign']
  );
  const buf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
