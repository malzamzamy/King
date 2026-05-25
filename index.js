import 'dotenv/config';
import { createRequire } from 'module';
import wolfjs from 'wolf.js';

// استخدام createRequire لحل مشكلة المكتبات القديمة
const require = createRequire(import.meta.url);
const Jimp = require('jimp');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const { WOLF } = wolfjs;
const client = new WOLF();

// الإعدادات
const TARGET_USER_ID = "51660277";
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت متصل ومستعد للمراقبة!");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    // 1. مراقبة الرسائل من المستخدم المحدد
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        // 2. طباعة تفاصيل الرسالة لتشخيص المشكلة (ستظهر في سجلات GitHub)
        console.log("📥 تم استلام رسالة من المستخدم المستهدف:");
        console.log("Attachments count:", message.attachments ? message.attachments.length : "None");
        
        // 3. التحقق من وجود مرفقات (Attachments) أو وسائط (Media)
        const attachment = message.attachments && message.attachments.length > 0 
            ? message.attachments[0] 
            : null;

        if (attachment) {
            console.log("📸 تم اكتشاف مرفق! نوع المرفق:", attachment.mimeType);
            
            const imgUrl = attachment.link;
            try {
                const similarity = await compareImages(imgUrl, 'reference.png');
                console.log(`📊 نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);

                if (similarity >= 0.90) {
                    console.log("✅ النتيجة: صورة مطابقة!");
                } else {
                    console.log("❌ النتيجة: صورة غير مطابقة.");
                }
            } catch (err) {
                console.error("خطأ أثناء معالجة الصورة:", err.message);
            }
        } else {
            // إذا وصلنا هنا ولم يجد المرفق، سنطبع كامل الرسالة لنعرف أين تختبئ الصورة
            console.log("⚠️ لم يتم العثور على مرفقات تقليدية. محتوى الرسالة:", JSON.stringify(message, null, 2));
        }
    }
});

// دالة مقارنة الصور
async function compareImages(imageUrl, refPath) {
    const img1 = await Jimp.read(imageUrl);
    const img2 = await Jimp.read(refPath);

    const width = 300;
    const height = 150;
    img1.resize(width, height);
    img2.resize(width, height);

    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
        img1.bitmap.data,
        img2.bitmap.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 } 
    );

    const totalPixels = width * height;
    return 1 - (numDiffPixels / totalPixels);
}

// تسجيل الدخول
client.login(process.env.U_MAIL, process.env.U_PASS);
