const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// توکن ربات خود را وارد کنید
const token = '8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc';

// ایجاد ربات تلگرام
const bot = new TelegramBot(token, { polling: true });

// ایجاد سرور Express
const app = express();
app.use(bodyParser.json());

// ذخیره شناسه چت کاربران
let chatId = null;

// زمانی که کاربر به ربات پیام می‌دهد
bot.on('message', (msg) => {
  const userId = msg.chat.id;
  const userMessage = msg.text;

  // ذخیره شناسه چت کاربر
  chatId = userId;

  // ارسال پیام به شما
  bot.sendMessage(chatId, 'پیام شما ارسال شد، لطفاً منتظر پاسخ باشید.');

  // ارسال پیام به خود شما
  bot.sendMessage(توکن_ربات_شما, `کاربر جدید پیام فرستاده: \n${userMessage}`);
});

// زمانی که شما پاسخ می‌دهید
app.post('/reply', (req, res) => {
  const replyMessage = req.body.message;
  
  // بررسی اینکه آیا شناسه چت ذخیره شده وجود دارد
  if (chatId) {
    bot.sendMessage(chatId, replyMessage);
    res.status(200).send('پیام ارسال شد!');
  } else {
    res.status(400).send('هیچ کاربری برای ارسال پیام پیدا نشد.');
  }
});

// راه‌اندازی سرور Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
