-- Deployment preparation, not applied by the demo or by prisma validate.
-- Apply after the corresponding schema migration using a separate migration role.
ALTER TABLE "ComplianceProfile"
  ADD CONSTRAINT "risk_capacity_range" CHECK ("riskCapacityScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "buffer_nonnegative" CHECK ("emergencyBufferMonths" >= 0),
  ADD CONSTRAINT "kyc_evidence_required" CHECK (
    "kycTier" = 'UNVERIFIED' OR ("kycProviderReference" IS NOT NULL AND "kycVerifiedAt" IS NOT NULL));
ALTER TABLE "CreatorProfile"
  ADD CONSTRAINT "trust_score_range" CHECK ("trustScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "audit_evidence_required" CHECK (
    NOT "isAudited" OR ("auditEvidence" IS NOT NULL AND "auditedAt" IS NOT NULL)),
  ADD CONSTRAINT "verified_return_evidence_required" CHECK (
    "verifiedReturn1Y" IS NULL OR ("returnSource" IS NOT NULL AND "returnVerifiedAt" IS NOT NULL));
ALTER TABLE "TrustAuditLog"
  ADD CONSTRAINT "previous_score_range" CHECK ("previousScore" BETWEEN 0 AND 100),
  ADD CONSTRAINT "new_score_range" CHECK ("newScore" BETWEEN 0 AND 100);

CREATE FUNCTION reject_trust_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Trust audit records are append-only';
END;
$$;
CREATE TRIGGER trust_audit_no_change BEFORE UPDATE OR DELETE ON "TrustAuditLog"
  FOR EACH ROW EXECUTE FUNCTION reject_trust_audit_mutation();
CREATE TRIGGER trust_audit_no_truncate BEFORE TRUNCATE ON "TrustAuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION reject_trust_audit_mutation();
-- The runtime role must not own tables or have DDL, TRUNCATE, trigger-disable or superuser privileges.
-- A database owner can bypass triggers; this is not tamper-proof external storage.
