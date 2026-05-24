import wolfjs from 'wolf.js';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import Jimp from 'jimp';

const { WOLF } = wolfjs;
const service = new WOLF();

// الإعدادات
const CONFIG = {
    MAIN_GROUP_ID: 81889058, // الروم الذي يراقب فيه العضو
    TARGET_MEMBER_ID: 51660277, // العضو الذي يرسل الاختبار
    RESULT_ROOM_ID: 9969        // الروم الذي يتم إرسال الحل فيه
};

// 1. وظيفة حل الصور (OCR)
async function solveImage(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const image = await Jimp.read(response.data);
        const buffer = await image.greyscale().contrast(1).getBufferAsync(Jimp.MIME_JPEG);
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng+ara');
        return text.trim();
    } catch (err) {
        console.error("❌ خطأ في القراءة:", err.message);
        return null;
    }
}

// 2. تفعيل الأوامر المتكررة كل دقيقة
service.on('ready', () => {
    console.log("🚀 البوت يعمل...");

    setInterval(async () => {
        try {
            await service.messaging.sendGroupMessage(CONFIG.MAIN_GROUP_ID, "!مد مهام");
            console.log("📤 تم إرسال: !مد مهام");
            
            // انتظار ثانيتين ثم إرسال الأمر الثاني
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(CONFIG.MAIN_GROUP_ID, "!مد تحالف ايداع كل");
                console.log("📤 تم إرسال: !مد تحالف ايداع كل");
            }, 2000);
        } catch (err) {
            console.error("❌ فشل في إرسال الأوامر:", err.message);
        }
    }, 60000); // 60,000 ملي ثانية = 1 دقيقة
});

// 3. مراقبة رسائل العضو المحدد
service.on('groupMessage', async (message) => {
    // التأكد أن الرسالة في الروم المطلوب ومن العضو المطلوب
    if (message.targetGroupId !== CONFIG.MAIN_GROUP_ID || message.senderId !== CONFIG.TARGET_MEMBER_ID) return;

    // البحث عن وجود صورة
    let imageUrl = null;
    if (message.attachments && message.attachments.length > 0) {
        imageUrl = message.attachments[0].link;
    }

    if (imageUrl) {
        console.log("📸 تم رصد صورة اختبار، جاري الحل...");
        const result = await solveImage(imageUrl);
        
        if (result) {
            console.log(`🔑 الحل المستخرج: ${result}`);
            // إرسال النتيجة للروم المطلوب
            await service.messaging.sendGroupMessage(CONFIG.RESULT_ROOM_ID, `# ${result}`);
        }
    }
});

service.login(process.env.U_MAIL, process.env.U_PASS);
