import 'dotenv/config';
import { createRequire } from 'module';
import path from 'path'; // استيراد مكتبة المسارات
import wolfjs from 'wolf.js';

const require = createRequire(import.meta.url);
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp || JimpModule;
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
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        const isImageLink = message.type === 'text/image_link' || (message.body && message.body.match(/\.(jpeg|jpg|png)$/i));

        if (isImageLink) {
            const imgUrl = message.body;
            console.log("📸 تم اكتشاف رابط صورة! جاري المعالجة...");
            
            try {
                // نستخدم path.resolve للحصول على مسار الملف الحقيقي
                const refPath = path.resolve('./reference.jpg'); 
                const similarity = await compareImages(imgUrl, refPath);
                
                console.log(`📊 نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);

                if (similarity >= 0.90) {
                    console.log("✅ النتيجة: مطابقة 90%+");
                } else {
                    console.log("❌ النتيجة: غير مطابقة");
                }
            } catch (err) {
                console.error("خطأ أثناء المعالجة (تأكد من وجود صورة reference.png في المجلد):", err.message);
            }
        }
    }
});

async function compareImages(imageUrl, refPath) {
    const img1 = await Jimp.read(imageUrl);
    const img2 = await Jimp.read(refPath); // الآن سيقرأ المسار بشكل صحيح

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

client.login(process.env.U_MAIL, process.env.U_PASS);
