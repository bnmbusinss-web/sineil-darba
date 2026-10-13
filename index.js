const WebSocket = require('ws');

// استخدام منفذ Railway
const PORT = process.env.PORT || 8080;

// إعدادات السيرفر لتحمل الضغط العالي
const wss = new WebSocket.Server({ 
    port: PORT,
    perMessageDeflate: false, // تعطيل الضغط لتخفيف العبء عن المعالج (CPU)
    maxPayload: 1024 * 16 // تحديد حجم الرسالة الأقصى (16 كيلوبايت) لمنع هجمات الذاكرة
});

console.log(`🚀 سيرفر WebSockets عالي الأداء يعمل على المنفذ ${PORT}...`);

// نظام (Heartbeat) لاكتشاف وإغلاق الاتصالات الميتة لتوفير الرام (RAM)
function noop() {}
function heartbeat() {
    this.isAlive = true;
}

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate(); // إنهاء الاتصال فوراً إذا كان ميتاً

        ws.isAlive = false;
        ws.ping(noop);
    });
}, 30000); // فحص كل 30 ثانية

wss.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    // تم إزالة console.log عند الاتصال لأنها تبطئ السيرفر عند دخول آلاف المستخدمين في نفس اللحظة

    ws.on('message', function incoming(message, isBinary) {
        // توزيع سريع: تمرير الرسالة خام كما هي دون معالجتها
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message, { binary: isBinary });
            }
        });
    });
});

wss.on('close', function close() {
    clearInterval(interval);
});
