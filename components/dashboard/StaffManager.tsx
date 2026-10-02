'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type StaffMember = {
  id: string;
  email: string;
  role: 'CASHIER' | 'MANAGER';
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  activated_at: string | null;
};

export function StaffManager({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('CASHIER');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const response = await fetch('/api/merchant/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      const result = await response.json() as { success: boolean; staff?: StaffMember; message?: string };
      if (!response.ok || !result.success || !result.staff) throw new Error(result.message ?? 'Unable to invite staff.');
      setStaff((current) => [result.staff!, ...current.filter((item) => item.id !== result.staff!.id)]);
      setEmail(''); setMessage('Invitation saved. The staff member becomes active after signing in with this email.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to invite staff.'); }
    finally { setSaving(false); }
  }

  async function changeAccess(staffId: string, action: 'SUSPEND' | 'REINVITE') {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch('/api/merchant/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId, action }) });
      const result = await response.json() as { success: boolean; staff?: StaffMember; message?: string };
      if (!response.ok || !result.success || !result.staff) throw new Error(result.message ?? 'Unable to update access.');
      setStaff((current) => current.map((item) => item.id === staffId ? result.staff! : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update access.'); }
    finally { setSaving(false); }
  }

  return <div className="flex flex-col gap-6">
    <section className="card-luxury p-6"><p className="label-gold mb-1">Team access</p><h1 className="heading-luxury text-2xl text-obsidian-900">Cashiers and managers</h1><p className="mt-2 text-sm text-obsidian-500">Cashiers can confirm purchases and award points. They cannot change store settings, campaigns, rewards, or team access.</p>
      <form onSubmit={invite} className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="cashier@example.com" className="input-gold" />
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="input-gold flex w-full items-center justify-between text-left"
          >
            <span>{role === 'CASHIER' ? 'Cashier' : 'Manager'}</span>
            <ChevronDown className="h-4 w-4 text-obsidian-500" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-gold-100 bg-white shadow-gold-lg glass-card">
              <button
                type="button"
                onClick={() => { setRole('CASHIER'); setDropdownOpen(false); }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-gold-50/50 transition-colors"
              >
                Cashier
                {role === 'CASHIER' && <Check className="h-4 w-4 text-gold-metallic" />}
              </button>
              <button
                type="button"
                onClick={() => { setRole('MANAGER'); setDropdownOpen(false); }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-gold-50/50 transition-colors"
              >
                Manager
                {role === 'MANAGER' && <Check className="h-4 w-4 text-gold-metallic" />}
              </button>
            </div>
          )}
        </div>
        
        <button type="submit" disabled={saving} className="btn-gold disabled:opacity-60">{saving ? 'Saving…' : 'Invite staff'}</button>
      </form>
      {message && <p className="mt-3 text-sm text-obsidian-600">{message}</p>}
    </section>
    <section className="card-luxury overflow-hidden"><div className="border-b border-gold-100 px-6 py-4"><h2 className="font-semibold text-obsidian-800">Your team ({staff.length})</h2></div>
      {staff.length === 0 ? <p className="px-6 py-8 text-sm text-obsidian-500">No staff invitations yet.</p> : <div className="divide-y divide-gold-100">{staff.map((member) => <div key={member.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-obsidian-800">{member.email}</p><p className="mt-1 text-xs text-obsidian-500">{member.role} · {member.status}</p></div><div className="flex gap-2">{member.status === 'SUSPENDED' ? <button disabled={saving} onClick={() => void changeAccess(member.id, 'REINVITE')} className="btn-ghost-gold px-3 py-2 text-xs">Reinvite</button> : <button disabled={saving} onClick={() => void changeAccess(member.id, 'SUSPEND')} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Suspend</button>}</div></div>)}</div>}
    </section>
  </div>;
}

