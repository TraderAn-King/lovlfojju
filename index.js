const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// توکن ربات شما
const token = '8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc';

const bot = new TelegramBot(token, { polling: true });

// فرمان /fetch برای دانلود و ارسال فایل از URL
bot.onText(/\/fetch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1]; // URL ارسالی توسط کاربر

  try {
    // دریافت اطلاعات فایل از URL
    const response = await axios.get(url, { responseType: 'stream' });

    // نوع فایل و نام آن
    const fileType = response.headers['content-type'];

    // ارسال فایل به کاربر
    if (fileType.startsWith('image')) {
      bot.sendPhoto(chatId, response.data, { caption: `تصویر از ${url}` });
    } else if (fileType.startsWith('video')) {
      bot.sendVideo(chatId, response.data, { caption: `ویدیو از ${url}` });
    } else if (fileType.startsWith('audio')) {
      bot.sendAudio(chatId, response.data, { caption: `صدا از ${url}` });
    } else {
      bot.sendDocument(chatId, response.data, { caption: `فایل از ${url}` });
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'خطا در دریافت فایل، لطفاً URL صحیح را ارسال کنید.');
  }
});
