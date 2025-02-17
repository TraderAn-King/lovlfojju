const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// توکن ربات شما
const token = '8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc';

// شناسه چت ادمین
const adminChatId = '2048310529';  // شناسه چت ادمین

const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(bodyParser.json());

// ذخیره شناسه کاربر و پیام برای فوروارد کردن بعدی
let userMessages = {};

// هنگامی که یک کاربر به ربات پیام می‌دهد
bot.on('message', (msg) => {
  const userId = msg.chat.id;
  const userMessage = msg.text;

  // اگر پیام از ادمین نباشد، پیام را به ادمین ارسال می‌کنیم
  if (userId !== adminChatId) {
    userMessages[userId] = userMessage; // ذخیره پیام کاربر

    // ارسال پیام به ادمین
    bot.sendMessage(adminChatId, `پیام جدید از کاربر ${userId}:\n${userMessage}\n\nبرای پاسخ دادن به این پیام، لطفاً ریپلای کنید.`);

    // ارسال تاییدیه به کاربر
    bot.sendMessage(userId, 'پیام شما ارسال شد و در حال بررسی است.');
  }
});

// زمانی که ادمین به پیام ریپلای می‌دهد
bot.on('message', (msg) => {
  // اگر پیام از طرف ادمین باشد و به یک پیام ریپلای کند
  if (msg.reply_to_message && msg.chat.id === adminChatId) {
    const replyMessage = msg.text;
    const originalUserId = msg.reply_to_message.chat.id;

    // ارسال پاسخ به کاربر (فقط اگر کاربر شناخته شده باشد)
    if (userMessages[originalUserId]) {
      bot.sendMessage(originalUserId, `پاسخ از ادمین: ${replyMessage}`);
    }
  }
});

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const userId = msg.chat.id;
  
  // ارسال پیام خوشامدگویی به کاربر
  bot.sendMessage(userId, 'سلام! خوش آمدید به ربات ما. برای ارسال پیام به ادمین، کافی است پیام خود را وارد کنید.');
});

// راه‌اندازی سرور Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
