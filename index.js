const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "8192923916:AAFTExMMUB6mLaBarLdQRPolLJpa2GPEcZc"; // توکن رباتت را بگذار
const ADMIN_ID = 2048310529; // آی‌دی ادمین
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

let userLinks = {}; // ذخیره لینک‌ها برای کاربران

app.post("/", async (req, res) => {
    const body = req.body;
    if (!body.message) return res.sendStatus(200);

    const chatId = body.message.chat.id;
    const text = body.message.text;
    
    if (text === "/start") {
        await sendMessage(chatId, "به ربات همه‌کاره خوش آمدید!");
    } else if (text === "/changeurl") {
        userLinks[chatId] = [];
        await sendMessage(chatId, "لینک بفرست.");
    } else if (userLinks[chatId] && userLinks[chatId].length === 0 && isValidUrl(text)) {
        userLinks[chatId].push(text);
        await sendMessage(chatId, "بعدی بفرست.");
    } else if (userLinks[chatId]) {
        const index = userLinks[chatId].length + 1;
        const linkMessage = `Episode_${index}: [${text}](${userLinks[chatId][0]})`;
        await sendMessage(chatId, linkMessage, "Markdown");
        userLinks[chatId].push(text);
    } else {
        await sendMessage(chatId, "دستور نامعتبر است.");
    }

    res.sendStatus(200);
});

async function sendMessage(chatId, text, parseMode = "") {
    await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: parseMode || undefined,
        disable_web_page_preview: true
    });
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log("Bot is running...");
});
