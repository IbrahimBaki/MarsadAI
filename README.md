# مرصد — Marsad

كل جديد في عالم الـ AI، متفلتر يوم بيوم: Claude وskills وMCP وأدوات المطورين والموديلات وLaravel والمونتاج والتصميم.

- **المحتوى**: كل يوم مهمة مجدولة بتدوّر وتكتب `content/YYYY-MM-DD.json` حسب [DIGEST_GUIDE.md](DIGEST_GUIDE.md)، وتعمل push، فيعمل Vercel deploy لوحده.
- **الحالة لكل مستخدم** (شوفته / المفضلة): Upstash Redis من Vercel Marketplace.
- **الدخول**: يوزرات بسيطة من متغير البيئة `AUTH_USERS`.
- **PWA**: تقدر تثبّته على الموبايل، وبيفتح آخر محتوى حمّلته حتى من غير نت.

## النشر على Vercel (مرة واحدة)

1. على Vercel: **Add New → Project** وبعدين اعمل Import للريبو ده. الإعدادات الافتراضية تمام.
2. في **Settings → Environment Variables** ضيف:
   - `AUTH_SECRET`: نص عشوائي طويل (`openssl rand -base64 32`)
   - `AUTH_USERS`: مثلاً `ibrahim:كلمة-سر-قوية`
3. في **Storage → Marketplace** اختار **Upstash** ← **Redis**، واعمل Create واربطه بالمشروع. الـ env vars هتتضاف لوحدها.
4. اعمل **Redeploy** عشان المتغيرات الجديدة تشتغل.

## إضافة مستخدم

ضيفه في `AUTH_USERS` وافصل بين المستخدمين بـ `;`:

```
ibrahim:pass1;sara:pass2
```

ولو مش عايز الباسورد مكتوب صريح:

```bash
npm run hash-password -- sara "her-password"
# sara:scrypt.<salt>.<hash>  ← حط السطر ده مكان sara:pass2
```

وبعد أي تعديل في المتغيرات اعمل Redeploy.

## تطوير محلي

```bash
npm install
npm run dev        # http://localhost:3000 ، اليوزر demo / demo
npm run validate   # يتأكد إن ملفات content سليمة
npm run known      # كل اللينكات اللي اتنشرت قبل كده
```

من غير Redis، الـ Seen والمفضلة بيتخزنوا في الذاكرة وبيضيعوا لما السيرفر يقف.

## الأقسام

معرّفة في `src/lib/sections.ts`. لو ضفت قسم، ضيفه كمان في جدول الأقسام في `DIGEST_GUIDE.md`.

## اسم التطبيق

موجود في مكان واحد بس: `src/lib/config.ts`.
