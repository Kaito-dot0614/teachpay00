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
    res.status(200).json({events})
