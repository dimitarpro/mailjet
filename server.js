const express = require('express');
const cors = require('cors');
const Mailjet = require('node-mailjet');
require('dotenv').config();

const app = express();

// CORS Конфигурација (Дозволува барања од секоја страна, или можеш да ги ограничкиш)
app.use(cors());

// Автоматски парсирање на JSON тела во барањата
app.use(express.json());

// Иницијализација на Mailjet со податоците од .env фајлот
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

// Тест рута
app.get('/', (req, res) => {
  res.send('Mailjet API Backend е активен!');
});

// Рута за испраќање маил (POST /api/send-email)
app.post('/api/send-email', async (req, res) => {
  const { toEmail, toName, subject, message } = req.body;

  if (!toEmail || !message) {
    return res.status(400).json({ error: 'Недостасуваат задолжителни полиња (toEmail, message).' });
  }

  try {
    const request = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.SENDER_EMAIL, // Мора да е верификуван во Mailjet
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
      });

    const result = await request;
    res.status(200).json({ success: true, data: result.body });
  } catch (err) {
    console.error('Mailjet Грешка:', err);
    res.status(500).json({ success: false, error: err.message || 'Грешка при испраќање на маилот.' });
  }
});

// Стартување на серверот (Render автоматски доделува PORT преку процес)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Серверот работи на порт ${PORT}`);
});