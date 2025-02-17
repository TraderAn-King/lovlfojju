const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// توکن ربات خود را وارد کنید
const token = '8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc';

// شناسه چت فرد مشخص (شما)
const targetChatId = '2048310529';  // شناسه چت فرد مشخص

// ایجاد ربات تلگرام
const bot = new TelegramBot(token, { polling: true });

// ایجاد سرور Express
const app = express();
app.use(bodyParser.json());

// زمانی که کاربر به ربات پیام می‌دهد
bot.on('message', (msg) => {
  const userId = msg.chat.id;
  const userMessage = msg.text;

  // ارسال پیام به شما (فرد مشخص)
  bot.sendMessage(targetChatId, `پیام جدید از کاربر:\n${userMessage}`);

  // ارسال تاییدیه به کاربر
  bot.sendMessage(userId, 'پیام شما ارسال شد و در حال بررسی است.');
});

// زمانی که شما به پیام پاسخ می‌دهید
app.post('/reply', (req, res) => {
  const replyMessage = req.body.message;
  
  // ارسال پاسخ به فرد مشخص از طرف ربات
  if (targetChatId) {
    bot.sendMessage(targetChatId, replyMessage);
    res.status(200).send('پیام ارسال شد!');
  } else {
    res.status(400).send('هیچ فرد مشخصی برای ارسال پیام پیدا نشد.');
  }
});

// راه‌اندازی سرور Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
