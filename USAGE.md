# 🧴 دليل استخدام التطبيق

## 1. تشغيل التطبيق

### أول مرة
```bash
git clone <repo>
cd beauty-app
npm install
```

### يومياً
```bash
dev start          # شغل التطبيق + امسح QR في Expo Go
dev kill           # أوقف السيرفر
dev restart        # إعادة تشغيل
```

افتح Expo Go على جوالك وامسح QR code.

### السيرفر المحلي (Elixir API)
```bash
cd ml_backend
mix run --no-halt   # شغل على port 4000
```

---

## 2. تبديل محرك AI

افتح `.env` وأضف المفتاح اللي تبيه:

```env
# Gemini (أفضل Cloud AI)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...

# Google Vision (بديل أقل دقة)
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=AIzaSy...
```

**الأولوية:** TFLite محلي → Gemini API → Mock تلقائياً.

### يدوي — في App.tsx
```tsx
configureAI({ preferredBackend: 'tflite_mobilenetv2' }); // without internet
configureAI({ preferredBackend: 'google_gemini', googleGemini: { apiKey } }); // cloud
configureAI({ preferredBackend: 'mock' }); // random test data
```

---

## 3. شاشات التطبيق

### 🏠 Home
- **Start Scan** → كاميرا → تحليل → نتائج
- **Quick Demo** → نتائج تجريبية بدون كاميرا
- **Scan History** → المقارنة قبل/بعد
- **Product Match** → توصيات منتجات

### 📷 Skin Analysis — 5 مراحل
```
1. Scan   → camera auto-capture (وجه ثابت)
2. Detect → AI يحلل الصورة
3. Review → issues + markers + score
4. Advice → توصيات ذكية حسب نوع البشرة
5. Shop   → Browse Products
```

### 🎥 Video Scanner
- اختار فيديو من الاستوديو
- يحلل الإطارات ويكشف التغيرات

### 📊 Scan History
- يعرض كل المسوحات السابقة
- مقارنة قبل/بعد مع % تحسن
- تغير severity (mild → moderate → severe)

---

## 4. قاعدة البيانات (Neon PostgreSQL)

الاتصال تلقائي من `DATABASE_URL` في `.env`.

### أوامر Elixir
```bash
cd ml_backend
mix ecto.migrate        # تشغيل الهجرات
mix ecto.rollback       # تراجع
mix run priv/repo/seeds.exs  # إضافة بيانات تجريبية
```

### 15 جدول
| الجدول | المحتوى |
|--------|---------|
| users | المستخدمين |
| scan_results | نتائج المسح |
| acne_detections | تفاصيل الحبوب |
| products + *_* | كتالوج 200+ منتج |
| dermatologists | 50+ طبيب |
| bookings | الحجوزات |
| cart + items + orders | سلة المشتريات |
| progress_entries | تتبع أسبوعي |

---

## 5. إعادة توليد موديل TFLite

فقط إذا كنت تبي تدرب الموديل على بياناتك:

```bash
cd ml_backend
mix run ../scripts/generate_tflite_model.exs
```

يُنتج `assets/models/skin_analysis.onnx`، بعدين تحوله لـ TFLite بأداة خارجية.

**بدون تدريب:** الموديل الموجود (4.5MB) يشتغل فوراً.

---

## 6. API Reference

### TFLite inference
```
Input:  Tensor (224×224×3, normalized [-1, 1])
Output: Tensor (7) — [normal, whitehead, blackhead, papule, pustule, nodule, cyst]
```

### Elixir API (port 4000)
```
POST /api/analyze
Body: { "image": "base64..." }
Resp: { "issues": [...], "skin_type": "...", "severity": 0-10 }
```

### Gemini API
```
Image → base64 → Gemini 2.0 Flash → JSON
```

---

## 7. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Expo لا يشتغل | `dev kill` ثم `dev start` |
| الكاميرا لا تظهر | استخدم Quick Demo |
| TypeScript error | `npx tsc --noEmit` يشوف الأخطاء |
| Elixir لا يجمع | `mix deps.get` ثم `mix compile` |
| قاعدة البيانات | تأكد من `DATABASE_URL` في `.env` |
| النتائج عشوائية | AI مضبوط على Mock — ضع Gemini key في `.env` |
