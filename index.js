const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// توکن ربات خود را وارد کنید
const token = '8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc';

// شناسه چت ادمین (شما)
const adminChatId = '2048310529';  // شناسه چت ادمین (شما)

// ایجاد ربات تلگرام
const bot = new TelegramBot(token, { polling: true });

// ایجاد سرور Express
const app = express();
app.use(bodyParser.json());

// زمانی که کاربر به ربات پیام می‌دهد
bot.on('message', (msg) => {
  const userId = msg.chat.id;
  const userMessage = msg.text;
  
  // ارسال پیام به ادمین
  bot.sendMessage(adminChatId, `کاربر جدید پیام فرستاده: \n${userMessage}\n\nبرای پاسخ به این پیام، لطفاً به آن ریپلای کنید.`);
  
  // ذخیره شناسه پیام و شناسه کاربر برای فوروارد کردن پاسخ بعدی
  bot.on('message', (msg) => {
    if (msg.reply_to_message && msg.reply_to_message.text) {
      const replyToMessageId = msg.reply_to_message.message_id;
      const originalUserId = msg.reply_to_message.chat.id;
      
      // وقتی ادمین به پیام ریپلای می‌دهد، پیام ریپلای را فوروارد می‌کنیم
      bot.sendMessage(originalUserId, `پاسخ از ادمین: ${msg.text}`);
    }
  });

  // ارسال تاییدیه به کاربر
  bot.sendMessage(userId, 'پیام شما ارسال شد و در حال بررسی است.');
});

// راه‌اندازی سرور Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
