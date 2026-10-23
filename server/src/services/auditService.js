import { AuditEvent } from '../models/AuditEvent.js';

export async function recordAuditEvent(
  {
    actor,
    action,
    entity,
    entityId = null,
    patientId = null,
    patientName = null,
    summary,
    meta = {},
  },
  session = null
) {
  const event = new AuditEvent({
    at: new Date(),
    actorId: actor?._id || actor?.id || null,
    actorName: actor?.name || 'System',
    actorRole: actor?.role || 'SYSTEM',
    action,
    entity,
    entityId: entityId ? entityId.toString() : null,
    patientId: patientId || null,
    patientName: patientName || null,
    summary,
    meta,
  });

  return await event.save({ session });
}
