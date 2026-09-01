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

    const { uid, new_password } = JSON.parse(event.body || '{}');
    if (!uid || !new_password) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'uid ve yeni şifre gerekli.' }) };
    }
    if (String(new_password).length < 6) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Şifre en az 6 karakter olmalı.' }) };
    }

    await admin.auth(app).updateUser(uid, { password: new_password });

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message || 'Beklenmeyen hata' }) };
  }
};
