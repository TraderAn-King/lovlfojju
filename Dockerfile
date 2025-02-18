# استفاده از Node.js 18 به عنوان بیس ایمیج
FROM node:18

# تنظیم دایرکتوری کاری داخل کانتینر
WORKDIR /app

# کپی فایل‌های پروژه به داخل کانتینر
COPY package*.json ./
RUN npm install

# کپی بقیه فایل‌های پروژه
COPY . .

# پورت برای اجرا در Heroku
EXPOSE 3000

# اجرای برنامه
CMD ["npm", "start"]
