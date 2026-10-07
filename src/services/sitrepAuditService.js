// src/services/sitrepAuditService.js
import { supabase } from './supabase/client';

export async function logTransaction({
  sitrepId,
  incidentId,
  versionNumber,
  user,
  profile,
  action,
  fieldChanged = null,
  previousValue = null,
  newValue = null,
  remarks = ''
}) {
  try {
    await supabase.from('sitrep_transaction_history').insert([
      {
        sitrep_id: sitrepId,
        incident_id: incidentId,
        version_number: versionNumber,
        user_id: user?.id,
        user_name: profile?.full_name || profile?.email || 'System User',
        user_role: profile?.role || 'ENCODER',
        department: profile?.department || 'CDRRMD',
        action,
        field_changed: fieldChanged,
        previous_value: previousValue ? String(previousValue) : null,
        new_value: newValue ? String(newValue) : null,
        remarks
      }
    ]);
  } catch (err) {
    console.error('Audit trail logging failed:', err);
  }
}

export async function createVersionSnapshot({
  sitrepId,
  currentVersion,
  label,
  stage,
  snapshotData,
  user,
  profile
}) {
  try {
    const nextVersion = currentVersion + 1;

    // 1. Create Snapshot Record
    await supabase.from('sitrep_versions').insert([
      {
        sitrep_id: sitrepId,
        version_number: nextVersion,
        version_label: label || `Version ${nextVersion}`,
        stage: stage || 'DRAFT',
        snapshot_data: snapshotData,
        created_by: user?.id,
        created_by_name: profile?.full_name || profile?.email
      }
    ]);

    // 2. Bump Current Version on Situation Report
    await supabase
      .from('situation_reports')
      .update({
        current_version: nextVersion,
        workflow_stage: stage,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sitrepId);

    // 3. Log to audit trail
    await logTransaction({
      sitrepId,
      versionNumber: nextVersion,
      user,
      profile,
      action: 'VERSION_CREATED',
      fieldChanged: 'version_number',
      previousValue: currentVersion,
      newValue: nextVersion,
      remarks: label
    });

    return nextVersion;
  } catch (err) {
    console.error('Failed to create snapshot version:', err);
    throw err;
  }
}