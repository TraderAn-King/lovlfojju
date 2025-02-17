require("dotenv").config();
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("✅ Bot is running...");
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 2048310529;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let lockedChannels = {};
let lockedGroups = {};
let warnings = {}; // سیستم اخطار
let badWords = ["کلمه۱", "کلمه۲", "کلمه۳"]; // لیست کلمات نامناسب
let lockMedia = false; // قفل ارسال مدیا

// بررسی اینکه آیا ربات ادمین است؟
async function isBotAdmin(chatId) {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(admin => admin.user.id === (await bot.getMe()).id);
    } catch (error) {
        return false;
    }
}

// 🔒 قفل کردن کانال
bot.onText(/\/addchannel (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const channelUsername = match[1];

    if (!channelUsername.startsWith("@")) {
        return bot.sendMessage(chatId, "❌ لطفا یوزرنیم کانال را با @ وارد کنید!");
    }

    if (await isBotAdmin(channelUsername)) {
        lockedChannels[channelUsername] = true;
        bot.sendMessage(chatId, `✅ کانال ${channelUsername} قفل شد!`);
    } else {
        bot.sendMessage(chatId, `❌ ربات در کانال ${channelUsername} ادمین نیست!`);
    }
});

// 🔒 قفل کردن گروه
bot.onText(/\/addgroup (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const groupId = match[1];

    if (await isBotAdmin(groupId)) {
        lockedGroups[groupId] = true;
        bot.sendMessage(chatId, `✅ گروه ${groupId} قفل شد!`);
    } else {
        bot.sendMessage(chatId, `❌ ربات در گروه ${groupId} ادمین نیست!`);
    }
});

// ❌ حذف کانال یا گروه از لیست قفل‌شده‌ها
bot.onText(/\/del_(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const target = match[1];

    if (lockedChannels[`@${target}`]) {
        delete lockedChannels[`@${target}`];
        bot.sendMessage(chatId, `❌ کانال @${target} از لیست حذف شد!`);
    } else if (lockedGroups[target]) {
        delete lockedGroups[target];
        bot.sendMessage(chatId, `❌ گروه ${target} از لیست حذف شد!`);
    } else {
        bot.sendMessage(chatId, `❌ کانال یا گروه ${target} در لیست قفل نیست!`);
    }
});

// 📌 بررسی حذف ممبر و حذف ادمین متخلف
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // بررسی عضویت در گروه‌ها و کانال‌های قفل‌شده
    if (lockedChannels[chatId] || lockedGroups[chatId]) {
        if (msg.left_chat_member) {
            const adminId = msg.from.id;
            try {
                await bot.kickChatMember(chatId, adminId);
                bot.sendMessage(chatId, `🚨 ادمین ${adminId} به دلیل حذف ممبر از گروه حذف شد!`);
            } catch (error) {
                bot.sendMessage(chatId, `❌ نمی‌توان ادمین ${adminId} را حذف کرد!`);
            }
        }
    }

    // Anti-Link: حذف پیام‌هایی که لینک دارند
    if (msg.text && (msg.text.includes("http://") || msg.text.includes("https://") || msg.text.includes("t.me/"))) {
        if (userId !== ADMIN_ID) {
            await bot.deleteMessage(chatId, msg.message_id);
            bot.sendMessage(chatId, `❌ ${msg.from.first_name} ارسال لینک در این گروه ممنوع است!`);
        }
    }

    // Anti-Bot: حذف ربات‌هایی که اضافه می‌شوند
    if (msg.new_chat_members) {
        msg.new_chat_members.forEach(async (member) => {
            if (member.is_bot) {
                await bot.kickChatMember(chatId, member.id);
                bot.sendMessage(chatId, `🤖 ربات ${member.first_name} به دلیل ممنوعیت ربات‌ها حذف شد!`);
            }
        });
    }

    // Anti-BadWords: حذف پیام‌هایی که کلمات نامناسب دارند
    if (msg.text && badWords.some(word => msg.text.includes(word))) {
        await bot.deleteMessage(chatId, msg.message_id);
        bot.sendMessage(chatId, `🚫 ${msg.from.first_name} لطفاً از استفاده از کلمات نامناسب خودداری کنید!`);
    }

    // Warn System: اخطار دادن به کاربران متخلف
    if (!warnings[userId]) warnings[userId] = 0;
    if (msg.text && badWords.some(word => msg.text.includes(word))) {
        warnings[userId]++;
        if (warnings[userId] >= 3) {
            await bot.kickChatMember(chatId, userId);
            bot.sendMessage(chatId, `❌ ${msg.from.first_name} به دلیل ۳ اخطار از گروه حذف شد!`);
        } else {
            bot.sendMessage(chatId, `⚠️ ${msg.from.first_name} شما ${warnings[userId]}/3 اخطار دریافت کرده‌اید!`);
        }
    }

    // Lock Media: جلوگیری از ارسال فایل‌های خاص
    if (lockMedia && (msg.photo || msg.video || msg.document)) {
        await bot.deleteMessage(chatId, msg.message_id);
        bot.sendMessage(chatId, `📵 ارسال مدیا در این گروه ممنوع است!`);
    }
});

// فعال یا غیرفعال کردن قفل ارسال مدیا
bot.onText(/\/lockmedia (on|off)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.id !== ADMIN_ID) return;
    
    lockMedia = match[1] === "on";
    bot.sendMessage(chatId, `📵 قفل ارسال مدیا ${lockMedia ? "فعال" : "غیرفعال"} شد!`);
});

// Welcome System: خوش‌آمدگویی به کاربران جدید
bot.on("new_chat_members", (msg) => {
    const chatId = msg.chat.id;
    msg.new_chat_members.forEach((member) => {
        bot.sendMessage(chatId, `👋 خوش آمدید ${member.first_name}! لطفاً قوانین گروه را رعایت کنید.`);
    });
});

console.log("✅ ربات فعال شد...");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
