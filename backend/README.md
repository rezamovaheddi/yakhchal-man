# سرور بک‌اند هوش مصنوعی یخچال من (Yakhchal Man Backend)

این سرویس یک سرور سبک Node.js/Express است که به **Google Gemini API** متصل شده و بر اساس لیست اقلام موجود در یخچال، **۳ پیشنهاد غذای خلاقانه و خوشمزه** را همراه با دستور پخت و وضعیت مواد کمبوددار برمی‌گرداند.

---

### مشخصات و تنظیمات:
- **کلید API:** مقدار `GEMINI_API_KEY` در فایل `.env`
- **مدل فعال:** `gemini-3.5-flash-lite` (پاسخ‌دهی سریع، بهینه و با پشتیبانی کامل از زبان فارسی)
- **پورت پیش‌فرض:** `3001`
- **شناسه تانل کلادفلر (Cloudflare Tunnel ID):** `9d434a06-3486-4303-98dd-479105d6a5d8`

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

#### ۲. دریافت ۳ پیشنهاد غذا از هوش مصنوعی (`POST /api/ai/suggest`):
```http
POST http://localhost:3001/api/ai/suggest
Content-Type: application/json

{
  "ingredients": [
    { "name": "تخم‌مرغ", "quantity": 3, "unit": "عدد" },
    { "name": "گوجه‌فرنگی", "quantity": 2, "unit": "عدد" },
    { "name": "پیاز", "quantity": 1, "unit": "عدد" }
  ]
}
```
پاسخ خروجی:
```json
{
  "success": true,
  "model": "gemini-3.5-flash-lite",
  "count": 3,
  "suggestions": [
    {
      "id": "ai-1",
      "title": "املت گوجه‌فرنگی سنتی",
      "description": "املت خوش‌رنگ و لذیذ با گوجه تازه و تخم‌مرغ",
      "prepTime": "۱۵ دقیقه",
      "difficulty": "آسان",
      "category": "صبحانه و شام",
      "iconName": "egg",
      "matchedIngredients": ["تخم‌مرغ", "گوجه‌فرنگی", "پیاز"],
      "missingIngredients": ["روغن", "فلفل سیاه"],
      "instructions": [
        "پیاز و گوجه‌ها را ریز خرد کرده و در تابه تفت دهید.",
        "پس از نرم شدن گوجه‌ها، تخم‌مرغ‌ها را افزوده و هم بزنید.",
        "با نان گرم سرو کنید."
      ]
    }
    // ... ۲ پیشنهاد دیگر
  ]
}
```
