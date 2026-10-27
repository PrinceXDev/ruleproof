'use client';

import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import type useWorkspaceSession from '@/hooks/workbench/useWorkspaceSession';
import { Button, Field, cardClass, inputClass } from './Controls';

const WorkbenchLogin = ({ connection }: { connection: ReturnType<typeof useWorkspaceSession> }) => {
  const [value, setValue] = useState('');
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className={`${cardClass} p-8`}>
        <LockKeyhole className="mb-6 text-brand" size={28} />
        <h1 className="text-2xl font-semibold tracking-tight">Open your workspace.</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Use the access token assigned to your account. It stays in memory for this session.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            connection.signIn(value);
          }}
        >
          <Field label="Workspace access token">
            <input
              className={inputClass}
              type="password"
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" primary disabled={!value || connection.loading}>
            Open workspace <ArrowRight size={14} />
          </Button>
        </form>
        {connection.error && (
          <p role="alert" className="mt-4 text-sm text-fail">
            {connection.error}
          </p>
        )}
      </div>
    </div>
  );
};
export default WorkbenchLogin;
