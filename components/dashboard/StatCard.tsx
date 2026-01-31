interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconBg?: string;
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-primary-100' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
