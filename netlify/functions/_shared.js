// Ortak yardımcı: Firebase Admin SDK'yı Netlify ortam değişkeninden başlatır
// ve çağıran kullanıcının admin olup olmadığını doğrular.
const admin = require('firebase-admin');

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Sicil numarasını e-posta olarak kullanılabilecek güvenli bir stringe çevirir.
function toEmailLocalPart(registryNumber) {
  return String(registryNumber)
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9._-]/g, '');
}

const AUTH_EMAIL_DOMAIN = 'calisan.portal.local';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

// Authorization: Bearer <idToken> başlığını doğrular ve admin olup olmadığını kontrol eder.
async function requireAdmin(event, app) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: { statusCode: 401, body: 'Yetkilendirme başlığı eksik.' } };
  }
  const idToken = authHeader.slice(7);
  let decoded;
  try {
    decoded = await admin.auth(app).verifyIdToken(idToken);
  } catch {
    return { error: { statusCode: 401, body: 'Geçersiz oturum.' } };
  }
  const profileSnap = await admin.firestore(app).collection('profiles').doc(decoded.uid).get();
  if (!profileSnap.exists || profileSnap.data().role !== 'admin') {
    return { error: { statusCode: 403, body: 'Bu işlem için yönetici yetkisi gerekiyor.' } };
  }
  return { uid: decoded.uid };
}

module.exports = { getAdminApp, toEmailLocalPart, AUTH_EMAIL_DOMAIN, corsHeaders, requireAdmin };
