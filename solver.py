import cv2
import pytesseract
import sys
import numpy as np

# حدد مسار برنامج tesseract إذا لزم الأمر
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def solve_captcha(image_path):
    # 1. تحميل الصورة
    img = cv2.imread(image_path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # 2. تحديد اللون الأصفر (الإطار المتقطع)
    # هذه القيم تحتاج ضبط بسيط حسب دقة الصورة
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([40, 255, 255])
    mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

    # 3. إيجاد المربع
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 50 and h > 50:  # تجاهل المساحات الصغيرة
            # قص المربع
            roi = img[y:y+h, x:x+w]
            
            # تحويل للرمادي للتحسين
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

            # قراءة النص بالعربية والإنجليزية
            text = pytesseract.image_to_string(thresh, lang='ara+eng', config='--psm 7')
            return text.strip()
    return None

if __name__ == "__main__":
    result = solve_captcha(sys.argv[1])
    print(result)

