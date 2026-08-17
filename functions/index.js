// ═══════════════════════════════════════════════
// TACRE — Funciones de servidor (MEJ-52)
// Alta y gestión de usuarios SIN abrir la consola de Firebase y SIN habilitar el
// auto-registro: solo quien está en la colección `admins` puede crear cuentas.
// Se despliegan con:  firebase deploy --only functions
// ═══════════════════════════════════════════════
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

const db = () => admin.firestore();

// Verifica que quien llama tenga sesión y esté registrado como administrador
async function exigirAdmin(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  const doc = await db().collection('admins').doc(uid).get();
  if (!doc.exists) throw new HttpsError('permission-denied', 'Solo un administrador puede realizar esta acción.');
  return uid;
}

// usuario "juan" → correo técnico "juan@tacre.app" (si ya viene con @, se respeta)
function correoDe(usuario) {
  const u = String(usuario || '').trim().toLowerCase();
  return u.includes('@') ? u : (u + '@tacre.app');
}

// ── Crear un usuario completo: cuenta de acceso + perfil con su rol ──
exports.crearUsuario = onCall({region: 'us-central1'}, async (request) => {
  await exigirAdmin(request);
  const d = request.data || {};
  const usuario = String(d.usuario || '').trim().toLowerCase();
  const nombre = String(d.nombre || '').trim();
  const pass = String(d.pass || '');
  const roles = Array.isArray(d.roles) && d.roles.length ? d.roles : ['vendedor'];

  if (!usuario || !nombre) throw new HttpsError('invalid-argument', 'Nombre y usuario son obligatorios.');
  if (pass.length < 6) throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
  if (roles.includes('superadmin')) throw new HttpsError('permission-denied', 'El rol superadmin no se asigna desde aquí.');

  const email = correoDe(usuario);

  // no permitir duplicados de nombre de usuario en los perfiles
  const yaExiste = await db().collection('usuarios').where('user', '==', usuario).limit(1).get();
  if (!yaExiste.empty) throw new HttpsError('already-exists', 'Ya existe un usuario con ese nombre de acceso.');

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({email, password: pass, displayName: nombre});
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Ese usuario ya tiene una cuenta de acceso.');
    throw new HttpsError('internal', 'No se pudo crear la cuenta: ' + (e.message || e.code));
  }

  const id = Date.now();
  const perfil = {id, uid: userRecord.uid, nombre, user: usuario, hash: '', roles, activo: true};
  await db().collection('usuarios').doc(String(id)).set(perfil);
  if (roles.includes('admin')) {
    await db().collection('admins').doc(userRecord.uid).set({roles, nombre, ts: new Date().toISOString()});
  }
  return {ok: true, uid: userRecord.uid, id, email};
});

// ── Restablecer la contraseña de alguien del equipo ──
exports.cambiarPassword = onCall({region: 'us-central1'}, async (request) => {
  await exigirAdmin(request);
  const d = request.data || {};
  const usuario = String(d.usuario || '').trim().toLowerCase();
  const pass = String(d.pass || '');
  if (!usuario) throw new HttpsError('invalid-argument', 'Falta el usuario.');
  if (pass.length < 6) throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
  try {
    const u = await admin.auth().getUserByEmail(correoDe(usuario));
    await admin.auth().updateUser(u.uid, {password: pass});
    return {ok: true};
  } catch (e) {
    throw new HttpsError('not-found', 'No se encontró la cuenta de acceso de ese usuario.');
  }
});

// ── Activar / desactivar el acceso de alguien (sin borrar su historial) ──
exports.accesoUsuario = onCall({region: 'us-central1'}, async (request) => {
  await exigirAdmin(request);
  const d = request.data || {};
  const usuario = String(d.usuario || '').trim().toLowerCase();
  const activo = d.activo !== false;
  if (!usuario) throw new HttpsError('invalid-argument', 'Falta el usuario.');
  try {
    const u = await admin.auth().getUserByEmail(correoDe(usuario));
    await admin.auth().updateUser(u.uid, {disabled: !activo});
    return {ok: true};
  } catch (e) {
    throw new HttpsError('not-found', 'No se encontró la cuenta de acceso de ese usuario.');
  }
});
