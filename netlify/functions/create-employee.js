const admin = require('firebase-admin');
const { getAdminApp, toEmailLocalPart, AUTH_EMAIL_DOMAIN, corsHeaders, requireAdmin } = require('./_shared');

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

    const body = JSON.parse(event.body || '{}');
    const {
      registry_number,
      password,
      first_name,
      last_name,
      department,
      annual_leave_total,
      flexible_hours_start,
      flexible_hours_end,
      flexible_work_note
    } = body;

    if (!registry_number || !password || !first_name || !last_name) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Zorunlu alanlar eksik (sicil no, şifre, ad, soyad).' }) };
    }
    if (String(password).length < 6) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Şifre en az 6 karakter olmalı.' }) };
    }

    const registryNumber = String(registry_number).trim();
    const localPart = toEmailLocalPart(registryNumber);
    if (!localPart) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Geçersiz sicil numarası.' }) };
    }
    const technicalEmail = `${localPart}@${AUTH_EMAIL_DOMAIN}`;

    const db = admin.firestore(app);
    const lookupRef = db.collection('registryLookup').doc(registryNumber);
    const existing = await lookupRef.get();
    if (existing.exists) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Bu sicil numarası zaten kullanımda.' }) };
    }

    const userRecord = await admin.auth(app).createUser({
      email: technicalEmail,
      password,
      emailVerified: true
    });

    const profile = {
      registryNumber,
      email: technicalEmail,
      firstName: first_name,
      lastName: last_name,
      department: department || 'Genel',
      role: 'employee',
      annualLeaveTotal: annual_leave_total ?? 14,
      annualLeaveUsed: 0,
      flexibleHoursStart: flexible_hours_start || '09:00',
      flexibleHoursEnd: flexible_hours_end || '18:00',
      flexibleWorkNote: flexible_work_note || 'Standart mesai',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('profiles').doc(userRecord.uid).set(profile);
    await lookupRef.set({ email: technicalEmail, uid: userRecord.uid });

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, uid: userRecord.uid }) };
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists'
      ? 'Bu sicil numarası zaten kullanımda.'
      : (err.message || 'Beklenmeyen hata');
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: msg }) };
  }
};
