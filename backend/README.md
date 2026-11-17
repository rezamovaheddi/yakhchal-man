# سرور بک‌اند هوش مصنوعی یخچال من (Yakhchal Man Backend)

این سرویس یک سرور سبک Node.js/Express است که به **Google Gemini API** متصل شده و بر اساس لیست اقلام موجود در یخچال، **۳ پیشنهاد غذای خلاقانه و خوشمزه** را همراه با دستور پخت و وضعیت مواد کمبوددار برمی‌گرداند.

---

### مشخصات و تنظیمات:
- **کلید API:** مقدار `GEMINI_API_KEY` در فایل `.env`
- **مدل فعال:** `gemini-3.5-flash-lite` (پاسخ‌دهی سریع، بهینه و با پشتیبانی کامل از زبان فارسی)
- **پورت پیش‌فرض:** `3001`
- **توکن پنل مدیریت:** `ADMIN_TOKEN` در `.env` (بخش «پنل مدیریت» را ببینید)

---

### پنل مدیریت (Admin Panel):

داشبورد ادمین روی `/admin` سرو می‌شود و مستقیماً به دیتابیس زنده متصل است:
آمار کاربران، جستجوی کاربر، موجودی و رخدادهای هر کاربر، فید جریان رخدادها و حذف کاربر.

**فعال‌سازی روی Render (یک‌بار):**
1. توکن را از فایل `backend/.env` (مقدار `ADMIN_TOKEN=`) کپی کنید — یا توکن تازه بسازید:
   ```bash
   node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
   ```
2. در داشبورد Render → سرویس بک‌اند → **Environment** → متغیر جدید:
   - Key: `ADMIN_TOKEN` — Value: همان توکن
3. **Save Changes** (ری‌دیپلوی خودکار) و سپس `https://<your-service>.onrender.com/admin`

**امنیت:** توکن با double-hash و `timingSafeEqual` مقایسه می‌شود، از query string پذیرفته
نمی‌شود، ۱۰ تلاش اشتباه در ۱۰ دقیقه = مسدودسازی 429، و تا وقتی `ADMIN_TOKEN` تنظیم
نشده باشد پنل کاملاً غیرفعال است (503).

**قانون Rate Limit (سراسری):** حداکثر **۱۰ درخواست در دقیقه برای هر IP** روی اندپوینت‌های
اپلیکیشن؛ `/health` و مسیرهای ادمین معاف هستند. با `RATE_LIMIT_GLOBAL` قابل تغییر است.

---

### اتصال با Cloudflare Tunnel:
برای اتصال سرور لوکال به اینترنت جهت استفاده نسخه APK موبایل در همه‌جا:
فایل پیکربندی تانل در `backend/config.yml` با شناسه تانل شما آماده شده است.

**روش اول (با فایل Credentials):**
فایل `9d434a06-3486-4303-98dd-479105d6a5d8.json` دریافتی از کلادفلر را در پوشه `backend/` قرار دهید و اجرا کنید:
```bash
npm run tunnel
```

**روش دوم (با توکن کلادفلر):**
اگر از داشبورد Cloudflare Zero Trust توکن (Token) دارید:
```bash
npx cloudflared tunnel run --token YOUR_CLOUDFLARE_TUNNEL_TOKEN
```

---

### راه‌اندازی و اجرای سرور:

۱. ورود به پوشه بک‌اند:
```bash
cd backend
```

۲. نصب وابستگی‌ها (فقط بار اول):
```bash
npm install
```

۳. اجرای سرور:
```bash
npm start
```

سرور روی نشانی `http://localhost:3001` شروع به کار می‌کند.

---

### اندپوینت‌های موجود:

#### ۱. بررسی سلامت سرور (`GET /health`):
```http
GET http://localhost:3001/health
```

#### ۳. ثبت اطلاعات یخچال و اقلام کاربر در پایگاه داده (`POST /api/user/fridge`):
نیاز به احراز هویت دستگاه دارد: `Authorization: Bearer <userId>:<syncSecret>`
(کلید ۲۵۶بیتی سمت اپ ساخته و با `POST /api/auth/register` ثبت می‌شود)
```http
POST http://localhost:3001/api/user/fridge
Authorization: Bearer usr-abc123:def456...
Content-Type: application/json

{
  "username": "رضا",
  "fridgeName": "یخچال خونه ما",
  "inventory": [
    { "name": "شیر", "quantity": 1, "unit": "لیتر" }
  ]
}
```

#### ۴. دریافت اطلاعات ذخیره‌شده کاربر (`GET /api/user/fridge/:userId`):
فقط با توکن معتبر همان کاربر و برای شناسه خودش.
```http
GET http://localhost:3001/api/user/fridge/usr-abc123
Authorization: Bearer usr-abc123:def456...
```

#### ۵. اندپوینت‌های پنل مدیریت (`/api/admin/*`):
با هدر `Authorization: Bearer <ADMIN_TOKEN>` — آمار، لیست کاربران، جزئیات،
رخدادها و حذف کاربر. صفحه ورود: `/admin`
