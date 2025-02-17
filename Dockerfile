# استفاده از یک تصویر رسمی Node.js
FROM node:16

# ایجاد پوشه کاری در کانتینر
WORKDIR /usr/src/app

# کپی کردن فایل‌های پروژه به داخل کانتینر
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install

# کپی کردن باقی‌مانده فایل‌های پروژه
COPY . .

# پورت مورد استفاده در پروژه
EXPOSE 3000

# اجرای پروژه
CMD ["npm", "start"]
