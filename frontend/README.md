# نظام إدارة مالية اتحاد ملاك برج الوليد

نظام ويب متكامل لإدارة الشؤون المالية لاتحاد ملاك برج الوليد — يتتبع الإيرادات والمصروفات، ينشئ المعاملات المتكررة تلقائياً، ويوفر لوحات تحكم وتقارير مالية عامة.

## المتطلبات

- Node.js 18+
- pnpm (مطلوب)
- قاعدة بيانات PostgreSQL (Neon DB)

## الإعداد

### 1. تثبيت الحزم

```bash
pnpm install
```

### 2. متغيرات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم:

```env
DATABASE_URL=                  # رابط قاعدة بيانات PostgreSQL
BETTER_AUTH_SECRET=            # مفتاح تشفير الجلسات
BETTER_AUTH_URL=               # رابط التطبيق
CLOUDINARY_CLOUD_NAME=         # اسم حساب Cloudinary
CLOUDINARY_API_KEY=            # مفتاح Cloudinary
CLOUDINARY_API_SECRET=         # سر Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_APP_URL=           # رابط التطبيق العام
ADMIN_EMAIL=                   # بريد المشرف للتهيئة
ADMIN_PASSWORD=                # كلمة مرور المشرف
CRON_SECRET=                   # سر مهمة cron المجدولة
```

### 3. تهيئة قاعدة البيانات

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. تشغيل المشروع

```bash
pnpm dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `pnpm dev` | تشغيل خادم التطوير |
| `pnpm build` | بناء المشروع للإنتاج |
| `pnpm start` | تشغيل نسخة الإنتاج |
| `pnpm lint` | فحص الكود |
| `pnpm db:generate` | توليد Prisma Client |
| `pnpm db:migrate` | تشغيل الترحيلات |
| `pnpm db:seed` | تهيئة البيانات الأولية |
| `pnpm db:studio` | فتح Prisma Studio |

## التقنيات المستخدمة

- **Next.js 14+** (App Router) — SSR + API Routes
- **TypeScript** — Strict mode
- **Neon DB** (PostgreSQL) — قاعدة البيانات
- **Prisma** — ORM
- **Better Auth** — المصادقة
- **Cloudinary** — رفع الملفات
- **Tailwind CSS** — التصميم (RTL)
- **Recharts** — الرسوم البيانية
- **jsPDF + html2canvas** — تصدير PDF

## النشر على Vercel

1. اربط المستودع بـ Vercel
2. أضف جميع متغيرات البيئة في إعدادات المشروع
3. شغّل `pnpm db:migrate` و `pnpm db:seed` على قاعدة البيانات الإنتاجية
4. أضف مهمة cron مجدولة:
   ```
   POST /api/recurring/generate
   التكرار: يوم 1 من كل شهر
   Authorization: Bearer <CRON_SECRET>
   ```

## السياسات

- **عدم القابلية للتعديل:** لا يمكن تعديل أو حذف أي معاملة بعد إنشائها
- **الشفافية:** جميع الصفحات العامة متاحة لأي زائر بدون تسجيل
- **الأمان:** مسارات الإدارة محمية بالمصادقة مع تحديد معدل الطلبات
