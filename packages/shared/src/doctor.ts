/**
 * Shared contract for the Doctor (system health) and Security self-check.
 *
 * Both surfaces return the same simple, honest shape: a flat list of checks the
 * UI renders as status rows. The `kind` tag keeps the security report truthful —
 * `real` means a server-side protection, `deterrence` means a softer measure
 * that raises the bar but is not a hard boundary. Never label deterrence as real.
 */

export type CheckStatus = 'ok' | 'warn' | 'fail';

export type CheckKind = 'real' | 'deterrence';

export interface DoctorCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** One-line human explanation of the result. */
  detail: string;
  /** Only set on security checks: real protection vs deterrence. */
  kind?: CheckKind;
}

export interface DoctorReport {
  /** Overall roll-up: worst status across all checks. */
  status: CheckStatus;
  checks: DoctorCheck[];
  /** When the report was generated (epoch ms). */
  generatedAt: number;
}
