#!/usr/bin/env node
import express from 'express';
import readme from 'readmeio';

if (!process.env.README_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_API_KEY` environment variable!');
  process.exit(1);
}

if (!process.env.README_SECRET) {
  // eslint-disable-next-line no-console
  console.error('Missing `README_SECRET` environment variable!');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 8000;

// API logging middleware
app.use((req, res, next) => {
  readme.log(process.env.README_API_KEY, req, res, {
    // User's API Key
    apiKey: 'owlbert-api-key',
    // Username to show in the dashboard
    label: 'Owlbert',
    // User's email address
    email: 'owlbert@example.com',
  });

  return next();
});

app.get('/', express.static('public'));

app.post('/', express.json(), (req, res) => {
  res.status(200).send({ simonSays: JSON.stringify(req.body) });
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/name/:name', (req, res) => {
  res.json({ message: `Hello ${req.params.name}!` });
});

// Personalized Docs Webhook
app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  // Verify the request is legitimate and came from ReadMe.
  const signature = req.headers['readme-signature'];
  const name = req.body.email.split('@')?.[0] || 'Owlbert';

  try {
    readme.verifyWebhook(req.body, signature, process.env.README_SECRET);
  } catch (e) {
    // Handle invalid requests
    return res.status(401).json({ error: e.message });
  }

  // Fetch the user from the database and return their data for use with OpenAPI variables.
  // const user = await db.find({ email: req.body.email })
  return res.json({
    name,
    // OAS Security variables
    petstore_auth: `petstore_auth_${name}`,
    api_key: `api_key_${name}`,
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  let url = `http://${server.address().address}:${port}`;
  // Logic for constructing URL in Glitch environment
  if (process.env.PROJECT_DOMAIN) url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
  // eslint-disable-next-line no-console
  console.log(`🦉 ReadMe Metrics Demo app listening at ${url}`);
});