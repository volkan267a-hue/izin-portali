const admin = require('firebase-admin');
const { getAdminApp, corsHeaders, requireAdmin } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Yalnızca POST kabul edilir.' }) };
  }

  try {
    const app = getAdminApp();
    const authCheck = await requireAdmin(event, app);
    if (authCheck.error) {
      return { statusCode: authCheck.error.statusCode, headers: corsHeaders(), body: JSON.stringify({ error: authCheck.error.body }) };
    }

    const { uid } = JSON.parse(event.body || '{}');
    if (!uid) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'uid eksik.' }) };
    }

    const db = admin.firestore(app);
    const profileSnap = await db.collection('profiles').doc(uid).get();
    const registryNumber = profileSnap.exists ? profileSnap.data().registryNumber : null;

    await admin.auth(app).deleteUser(uid).catch(() => {});
    await db.collection('profiles').doc(uid).delete();
    if (registryNumber) {
      await db.collection('registryLookup').doc(registryNumber).delete();
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message || 'Beklenmeyen hata' }) };
  }
};
