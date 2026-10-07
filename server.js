const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Mailjet API Backend е активен!');
});

app.post('/api/send-email', async (req, res) => {
  const { toEmail, toName, subject, message } = req.body;

  if (!toEmail || !message) {
    return res.status(400).json({ error: 'Недостасуваат задолжителни полиња (toEmail, message).' });
  }

  try {
    // Basic Auth за Mailjet API (PublicKey:PrivateKey претворени во Base64)
    const publicKey = process.env.MJ_APIKEY_PUBLIC;
    const privateKey = process.env.MJ_APIKEY_PRIVATE;
    const authString = Buffer.from(`${publicKey}:${privateKey}`).toString('base64');

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: process.env.SENDER_EMAIL,
              Name: process.env.SENDER_NAME || 'Моја Апликација'
            },
            To: [
              {
                Email: toEmail,
                Name: toName || 'Корисник'
              }
            ],
            Subject: subject || 'Порака од апликација',
            TextPart: message,
            HTMLPart: `<p>${message}</p>`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Mailjet Грешка:', err);
    res.status(500).json({ success: false, error: err.message || 'Грешка при испраќање на маилот.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Серверот работи на порт ${PORT}`);
});