import express from 'express';
import cors from 'cors';
import { AgentClient } from '@21st-sdk/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new AgentClient({
  apiKey: process.env.API_KEY_21ST || '21st_sk_f7753285170dd475f42563d49c03eb0df93bffb5c9084fae492cccb56ba6cb0c'
});

// Token endpoint for the chat widget
app.post('/api/an-token', async (req, res) => {
  try {
    const token = await client.tokens.create({ agent: 'headlessdev-agent' });
    res.json(token);
  } catch (err) {
    console.error('Token error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Sandbox creation endpoint
app.post('/api/sandbox', async (req, res) => {
  try {
    const sandbox = await client.sandboxes.create({ agent: 'headlessdev-agent' });
    res.json(sandbox);
  } catch (err) {
    console.error('Sandbox error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint - proxy messages to the agent
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sandboxId, threadId } = req.body;

    const result = await client.threads.run({
      agent: 'headlessdev-agent',
      sandboxId: sandboxId,
      threadId: threadId,
      messages: [
        { role: 'user', parts: [{ type: 'text', text: message }] }
      ]
    });

    res.json(result);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`headlessdev site running at http://localhost:${PORT}`);
  console.log('Agent chat widget active');
});
