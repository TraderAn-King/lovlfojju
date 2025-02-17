const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const app = express();

// اطلاعات ربات (🔴 اینجا مقدار توکن و آیدی ادمین را مستقیماً وارد کن)
const BOT_TOKEN = "توکن_ربات_اینجا";
const ADMIN_ID = 2048310529; // آیدی ادمین خود را اینجا وارد کن
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let lockedGroups = {}; // برای نگهداری وضعیت قفل گروه‌ها
let lockedChannels = {}; // برای نگهداری وضعیت قفل کانال‌ها
let badWords = ["کلمه۱", "کلمه۲", "کلمه۳"]; // لیست کلمات نامناسب
let lockMedia = {}; // برای وضعیت قفل ارسال مدیا
let warnings = {}; // سیستم اخطار برای اعضا

// بررسی اینکه آیا کاربر ادمین است؟
async function isGroupAdmin(chatId, userId) {
    const admins = await bot.getChatAdministrators(chatId);
    return admins.some(admin => admin.user.id === userId);
}

// قفل کردن گروه
bot.onText(/\/lockgroup/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (await isGroupAdmin(chatId, userId)) {
        lockedGroups[chatId] = true;
        bot.sendMessage(chatId, "✅ گروه قفل شد!");
    } else {
        bot.sendMessage(chatId, "❌ شما ادمین گروه نیستید!");
    }
});

// باز کردن قفل گروه
bot.onText(/\/unlockgroup/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (await isGroupAdmin(chatId, userId)) {
        lockedGroups[chatId] = false;
        bot.sendMessage(chatId, "✅ گروه باز شد!");
    } else {
        bot.sendMessage(chatId, "❌ شما ادمین گروه نیستید!");
    }
});

// قفل کردن کانال
bot.onText(/\/lockchannel (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const channelUsername = match[1];

    if (await isGroupAdmin(chatId, msg.from.id)) {
        lockedChannels[channelUsername] = true;
        bot.sendMessage(chatId, `✅ کانال @${channelUsername} قفل شد!`);
    } else {
        bot.sendMessage(chatId, "❌ شما ادمین گروه نیستید!");
    }
});

// باز کردن قفل کانال
bot.onText(/\/unlockchannel (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const channelUsername = match[1];

    if (await isGroupAdmin(chatId, msg.from.id)) {
        lockedChannels[channelUsername] = false;
        bot.sendMessage(chatId, `✅ کانال @${channelUsername} باز شد!`);
    } else {
        bot.sendMessage(chatId, "❌ شما ادمین گروه نیستید!");
    }
});

// اخطار به اعضای متخلف
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // سیستم ضد لینک: حذف پیام‌ها با لینک
    if (msg.text && (msg.text.includes("http://") || msg.text.includes("https://") || msg.text.includes("t.me/"))) {
        if (userId !== ADMIN_ID) {
            await bot.deleteMessage(chatId, msg.message_id);
            bot.sendMessage(chatId, `❌ ${msg.from.first_name} ارسال لینک در این گروه ممنوع است!`);
        }
    }

    // سیستم ضد ربات: حذف ربات‌ها
    if (msg.new_chat_members) {
        msg.new_chat_members.forEach(async (member) => {
            if (member.is_bot) {
                await bot.kickChatMember(chatId, member.id);
                bot.sendMessage(chatId, `🤖 ربات ${member.first_name} به دلیل ممنوعیت ربات‌ها حذف شد!`);
            }
        });
    }

    // سیستم ضد کلمات نامناسب: حذف پیام‌های حاوی کلمات نامناسب
    if (msg.text && badWords.some(word => msg.text.includes(word))) {
        await bot.deleteMessage(chatId, msg.message_id);
        bot.sendMessage(chatId, `🚫 ${msg.from.first_name} لطفاً از استفاده از کلمات نامناسب خودداری کنید!`);
    }

    // سیستم اخطار: افزایش اخطار برای اعضای متخلف
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
});

// قفل ارسال مدیا
bot.onText(/\/lockmedia (on|off)/, (msg, match) => {
    const chatId = msg.chat.id;

    if (msg.from.id === ADMIN_ID) {
        lockMedia[chatId] = match[1] === "on";
        bot.sendMessage(chatId, `📵 قفل ارسال مدیا ${lockMedia[chatId] ? "فعال" : "غیرفعال"} شد!`);
    }
});

// خوش آمدگویی به اعضای جدید
bot.on("new_chat_members", (msg) => {
    const chatId = msg.chat.id;
    msg.new_chat_members.forEach((member) => {
        bot.sendMessage(chatId, `👋 خوش آمدید ${member.first_name}! لطفاً قوانین گروه را رعایت کنید.`);
    });
});

// پنل شیشه‌ای برای تغییر وضعیت ویژگی‌ها
bot.onText(/\/panel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (await isGroupAdmin(chatId, userId)) {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: lockedGroups[chatId] ? "Unlock Group" : "Lock Group", callback_data: "toggleGroupLock" },
                        { text: lockMedia[chatId] ? "Unlock Media" : "Lock Media", callback_data: "toggleMediaLock" }
                    ]
                ]
            }
        };
        bot.sendMessage(chatId, "📋 Panel - Select an action:", options);
    } else {
        bot.sendMessage(chatId, "❌ شما باید ادمین گروه باشید.");
    }
});

// مدیریت دکمه‌های inline
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (!await isGroupAdmin(chatId, userId)) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: "❌ شما باید ادمین گروه باشید.", show_alert: true });
    }

    if (data === "toggleGroupLock") {
        lockedGroups[chatId] = !lockedGroups[chatId];
        bot.answerCallbackQuery(callbackQuery.id, { text: lockedGroups[chatId] ? "گروه قفل شد." : "گروه باز شد." });
        bot.sendMessage(chatId, `🔒 گروه ${lockedGroups[chatId] ? "قفل" : "باز"} شد.`);
    }

    if (data === "toggleMediaLock") {
        lockMedia[chatId] = !lockMedia[chatId];
        bot.answerCallbackQuery(callbackQuery.id, { text: lockMedia[chatId] ? "ارسال مدیا قفل شد." : "ارسال مدیا باز شد." });
        bot.sendMessage(chatId, `📵 ارسال مدیا ${lockMedia[chatId] ? "قفل" : "باز"} شد.`);
    }
});

// اجرای سرور برای Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
