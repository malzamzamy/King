import 'dotenv/config';
import { createRequire } from 'module';
import wolfjs from 'wolf.js';

const require = createRequire(import.meta.url);

// استيراد المكتبات مع معالجة ذكية للهيكل (Fallback)
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp || JimpModule; // حل مشكلة Jimp.read

const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const { WOLF } = wolfjs;
const client = new WOLF();

// الإعدادات
const TARGET_USER_ID = 51660277;
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت متصل ومستعد للمراقبة!");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    // التحقق من هوية المرسل والقناة
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        // التحقق: هل النوع هو رابط صورة
        const isImageLink = message.type === 'text/image_link' || (message.body && message.body.match(/\.(jpeg|jpg|png)$/i));

        if (isImageLink) {
            const imgUrl = message.body;
            console.log("📸 تم اكتشاف رابط صورة! جاري المعالجة...");
            
            try {
                // نمرر رابط الصورة والملف المحلي
                const similarity = await compareImages(imgUrl, 'reference.png');
                console.log(`📊 نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);

                if (similarity >= 0.90) {
                    console.log("✅ النتيجة: مطابقة 90%+");
                } else {
                    console.log("❌ النتيجة: غير مطابقة");
                }
            } catch (err) {
                console.error("خطأ أثناء المعالجة (تأكد من وجود صورة reference.png):", err.message);
            }
        }
    }
});

// دالة مقارنة الصور
async function compareImages(imageUrl, refPath) {
    // قراءة الصور
    const img1 = await Jimp.read(imageUrl);
    const img2 = await Jimp.read(refPath);

    // توحيد الأبعاد (300x150) للمقارنة
    const width = 300;
    const height = 150;
    img1.resize(width, height);
    img2.resize(width, height);

    const diff = new PNG({ width, height });

    // إجراء المقارنة
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
