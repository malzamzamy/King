import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

const { WOLF } = wolfjs;
const client = new WOLF();

// الإعدادات (تأكد من صحتها)
const TARGET_USER_ID = 51660277;
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت متصل ومستعد لمراقبة الرموز العربية والإنجليزية!");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        const imageUrl = message.body || (message.attachments && message.attachments[0]?.link);

        if (imageUrl && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') || imageUrl.endsWith('.png'))) {
            console.log("📸 اكتشفت صورة اختبار! جاري عزل البطاقة وتحسين الخط العربي...");
            try {
                // استدعاء دالة المعالجة المحسنة
                const code = await solveCaptcha(imageUrl);
                console.log(`🎯 الرمز المستخرج هو: '${code}'`);
                
                // يمكنك تفعيل الرد هنا إذا أردت
                // await client.messaging.sendGroupMessage(CHANNEL_ID, `#${code}`);
                
            } catch (err) {
                console.error("❌ خطأ أثناء المعالجة:", err.message);
            }
        }
    }
});

/**
 * دالة تحليل الصورة المقصوصة وتحسينها لقراءة الحروف العربية بدقة
 */
async function solveCaptcha(url) {
    // 1. تحميل الصورة الأصلية
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. تحليل البكسلات لاكتشاف الإطار الأصفر
    const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    let minX = info.width, minY = info.height, maxX = 0, maxY = 0, found = false;

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * 4;
            if (data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] < 100) { // شرط اللون الأصفر
                minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                found = true;
            }
        }
    }
    if (!found) throw new Error("لم يتم العثور على الإطار الأصفر!");

    // 3. تحديد منطقة القص (مع هامش صغير للداخل لتجنب الإطار)
    const margin = 8;
    const cropX = minX + margin;
    const cropY = minY + margin;
    const cropWidth = (maxX - minX) - (margin * 2);
    const cropHeight = (maxY - minY) - (margin * 2);

    if (cropWidth <= 0 || cropHeight <= 0) throw new Error("البطاقة المميزة صغيرة جداً.");

    // 4. القص وتحسين الصورة (الإعدادات الجديدة للحصول على أنقى خط عربي)
    const processedBuffer = await sharp(buffer)
        .extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight })
        .greyscale() // تحويل لأسود وأبيض
        .normalize() // تحسين التباين
        .linear(1.5, -0.2) // تفتيح الصورة قليلاً لفصل الحروف المتلاصقة
        .sharpen() // زيادة حدة الخطوط
        .toBuffer();

    // 5. استخدام Tesseract للقراءة (دعم كامل للعربية والإنجليزية)
    const worker = await createWorker('eng+ara');
    
    // إعدادات إضافية للمحرك لتحسين قراءة الكلمات المنفردة
    await worker.setParameters({
        tessedit_pageseg_mode: '7', // معاملة النص كسطر واحد (SINGLE_LINE)
    });

    const { data: { text } } = await worker.recognize(processedBuffer);
    await worker.terminate();

    // 6. تنظيف النص المستخرج: إزالة كل شيء عدا الحروف العربية والإنجليزية والأرقام
    return text.replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '').trim();
}

client.login(process.env.U_MAIL, process.env.U_PASS);
