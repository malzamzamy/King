import 'dotenv/config';
import { createRequire } from 'module';
import wolfjs from 'wolf.js';

// استخدام createRequire لحل مشكلة التوافق مع المكتبات القديمة
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
    console.log("🚀 البوت متصل وجاهز للمراقبة!");
    await client.group.joinById(CHANNEL_ID);
    console.log(`✅ تم الانضمام للقناة: ${CHANNEL_ID}`);
});

client.on('groupMessage', async (message) => {
    // التحقق من هوية المرسل والقناة
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        // التحقق من وجود صورة
        if (message.attachments && message.attachments.length > 0) {
            const imgUrl = message.attachments[0].link;
            console.log("📸 تم استلام صورة من المستخدم المستهدف.. جاري المعالجة");
            
            try {
                const similarity = await compareImages(imgUrl, 'reference.png');
                console.log(`📊 نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);

                if (similarity >= 0.90) {
                    console.log("✅ النتيجة: مطابقة (يتم إرسال التنبيه هنا)");
                } else {
                    console.log("❌ النتيجة: غير مطابقة");
                }
            } catch (err) {
                console.error("خطأ في معالجة الصورة:", err);
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
