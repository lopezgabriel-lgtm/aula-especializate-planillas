/* =========================================================================
   routes/progress.js — Persistencia del progreso por estudiante.

     GET  /api/progress → devuelve el documento del estudiante autenticado.
     PUT  /api/progress → guarda el documento del estudiante autenticado.

   REGLA DE IDENTIDAD (crítica):
   El estudiante se determina SIEMPRE desde la sesión LTI del servidor
   (req.session.lti.stableId). NUNCA desde la URL ni desde el cuerpo. No existe
   —ni se acepta— algo como /api/progress?user_id=123: cualquier identificador
   que mande el navegador se ignora por completo. Así un cliente no puede leer
   ni escribir el progreso de otro estudiante.

   El almacenamiento concreto está detrás de ProgressStore (ver progress/store.js),
   así que cambiar de tecnología no afecta a esta ruta.
   ========================================================================= */
import { Router } from 'express';
import config from '../config.js';
import { requireSession } from '../middleware/requireSession.js';
import { createProgressStore } from '../progress/store.js';

const store = createProgressStore(config.progress);
const MAX_DOC_BYTES = 200 * 1024; // el documento de progreso es pequeño (<5 KB)

const router = Router();

// Toda esta ruta exige sesión válida (requireSession → 401 JSON si no hay).
router.use(requireSession);

// Identidad del estudiante: SIEMPRE desde la sesión, nunca del cliente.
function studentKey(req) {
  // Identidad SIEMPRE desde la sesión; se antepone el curso (config) para aislar
  // el progreso por curso cuando varias aulas comparten almacén.
  var cid = config.progress.courseId;
  return (cid ? cid + ':' : '') + req.session.lti.stableId;
}

router.get('/api/progress', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rec = await store.get(studentKey(req));
    return res.json({
      doc: rec ? rec.doc : null,
      updatedAt: rec ? rec.updatedAt : null,
    });
  } catch (e) {
    return res.status(500).json({ error: 'store_error' });
  }
});

router.put('/api/progress', async (req, res) => {
  const doc = req.body;
  // El documento debe ser un objeto JSON. Cualquier campo tipo user_id/sub que
  // venga adentro se guarda como dato opaco pero NO influye en a quién se asocia:
  // la asociación es SIEMPRE studentKey(req) (la sesión).
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return res.status(400).json({ error: 'documento_invalido' });
  }
  let size;
  try { size = Buffer.byteLength(JSON.stringify(doc)); } catch (e) { return res.status(400).json({ error: 'documento_invalido' }); }
  if (size > MAX_DOC_BYTES) {
    return res.status(413).json({ error: 'documento_demasiado_grande' });
  }
  try {
    const { updatedAt } = await store.put(studentKey(req), doc);
    return res.json({ ok: true, updatedAt });
  } catch (e) {
    return res.status(500).json({ error: 'store_error' });
  }
});

export default router;
