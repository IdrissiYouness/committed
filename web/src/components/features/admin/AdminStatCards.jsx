import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';

import StatCard from '../dashboard/StatCard';

/**
 * AdminStatCards
 *
 * Four metric tiles shown at the top of the Admin Dashboard and Admin Page.
 * Values are derived from the four parallel stat counts fetched by useAdminUsers.
 *
 * Tiles:
 *   Total Users    — stats.total
 *   Active Users   — stats.active
 *   Admins         — stats.adminCount
 *   Inactive Users — stats.inactive
 *
 * Props:
 *   stats      — { total, active, inactive, adminCount } (null values show "—")
 *   isLoading  — shows animated skeleton in each StatCard
 */

const STAT_CONFIG = [
  {
    label:       'Total Users',
    icon:        Users,
    colorClasses:'bg-primary-50 text-primary-600 border-primary-100',
    statKey:     'total',
  },
  {
    label:       'Active Users',
    icon:        UserCheck,
    colorClasses:'bg-secondary-50 text-secondary-600 border-secondary-100',
    statKey:     'active',
  },
  {
    label:       'Admins',
    icon:        ShieldCheck,
    colorClasses:'bg-primary-50 text-primary-700 border-primary-100',
    statKey:     'adminCount',
  },
  {
    label:       'Inactive Users',
    icon:        UserX,
    colorClasses:'bg-neutral-50 text-neutral-500 border-neutral-200',
    statKey:     'inactive',
  },
];

export default function AdminStatCards({ stats = {}, isLoading = false }) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="list"
      aria-label="Platform statistics"
    >
      {STAT_CONFIG.map(({ label, icon, colorClasses, statKey }) => (
        <StatCard
          key={label}
          label={label}
          value={stats[statKey] ?? null}
          icon={icon}
          colorClasses={colorClasses}
          isLoading={isLoading}
        />
      ))}
    </ul>
  );
}