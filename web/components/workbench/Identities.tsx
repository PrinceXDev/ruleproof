'use client';

import { SUITE_LIMITS } from '@/constants/workbench';

import type { Suite } from '@/lib/workbench';
import { KeyRound, Plus, Trash2, UserRound } from 'lucide-react';
import { Button, cardClass, Field, inputClass, Pill } from './Controls';

const Identities = ({
  suite,
  credentials,
  onChange,
  disabled,
}: {
  suite: Suite;
  credentials: string[];
  onChange: (suite: Suite) => void;
  disabled: boolean;
}) => {
  const update = (index: number, field: string, value: string) =>
    onChange({
      ...suite,
      identities: suite.identities.map((id, i) => (i === index ? { ...id, [field]: value } : id)),
    });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Who is making the request?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Model roles, tenants, owners, anonymous users, and expired sessions.
          </p>
        </div>
        <Button
          disabled={disabled || suite.identities.length >= SUITE_LIMITS.identities}
          onClick={() =>
            onChange({
              ...suite,
              identities: [
                ...suite.identities,
                {
                  id: `identity-${crypto.randomUUID().slice(0, 8)}`,
                  label: 'New identity',
                  role: 'member',
                  tenant: 'A',
                },
              ],
            })
          }
        >
          <Plus size={15} />
          Add identity
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {suite.identities.map((id, index) => (
          <article key={id.id} className={`${cardClass} p-5`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg border border-brand/20 bg-brand/5 p-2 text-brand">
                  <UserRound size={18} />
                </span>
                <div>
                  <h3 className="font-medium">{id.label}</h3>
                  <span className="font-mono text-[11px] text-ink-muted">{id.id}</span>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${id.label}`}
                title="Remove unused identity"
                disabled={
                  disabled ||
                  suite.cases.some((c) => c.identityId === id.id || c.state?.identityId === id.id)
                }
                onClick={() =>
                  onChange({
                    ...suite,
                    identities: suite.identities.filter((_, i) => i !== index),
                  })
                }
                className="rounded p-2 text-ink-muted hover:text-fail disabled:opacity-25"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  className={inputClass}
                  value={id.label}
                  onChange={(e) => update(index, 'label', e.target.value)}
                  maxLength={120}
                />
              </Field>
              <Field label="Role">
                <input
                  className={inputClass}
                  value={id.role}
                  onChange={(e) => update(index, 'role', e.target.value)}
                />
              </Field>
              <Field label="Tenant">
                <input
                  className={inputClass}
                  value={id.tenant}
                  onChange={(e) => update(index, 'tenant', e.target.value)}
                />
              </Field>
              <Field label="Credential reference">
                <select
                  className={inputClass}
                  value={id.credential ?? ''}
                  onChange={(e) => update(index, 'credential', e.target.value)}
                >
                  <option value="">Anonymous · no credential</option>
                  {credentials.map((ref) => (
                    <option key={ref} value={ref}>
                      {ref}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
              <KeyRound size={13} />
              {id.credential ? (
                'Resolved on the server at execution time'
              ) : (
                <Pill>Unauthenticated identity</Pill>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Identities;
