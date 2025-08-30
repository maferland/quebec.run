import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { Users, Calendar, UserCheck } from 'lucide-react'

async function getAdminStats() {
  const [clubCount, eventCount, userCount] = await Promise.all([
    prisma.club.count(),
    prisma.event.count(),
    prisma.user.count(),
  ])

  return {
    clubs: clubCount,
    events: eventCount,
    users: userCount,
  }
}

export default async function AdminDashboard() {
  const t = await getTranslations('admin.dashboard')
  const stats = await getAdminStats()

  const statCards = [
    {
      name: t('totalClubs'),
      value: stats.clubs,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: t('totalEvents'),
      value: stats.events,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: t('totalUsers'),
      value: stats.users,
      icon: UserCheck,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('title')}
        </h1>
        <p className="text-text-secondary mt-2">
          {t('overview')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-surface rounded-lg border border-border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-xl font-heading font-semibold text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/clubs"
            className="block p-4 border border-border rounded-lg hover:bg-surface-variant transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">Manage Clubs</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Add, edit, or remove running clubs
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}