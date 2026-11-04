import { Navigate } from 'react-router-dom'
import Card from '../../components/common/Card'

export default function AdminPlaceholder({ title, description }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">
        {title || 'Admin'}
      </h1>
      <Card className="p-6">
        <p className="text-sm leading-relaxed text-white/50">
          {description ||
            'This admin module is scaffolded and will be built out in Phase 14 — user management, sports & odds control, bet settlement and wallet operations.'}
        </p>
      </Card>
    </div>
  )
}

export function AdminRedirect() {
  return <Navigate to="/admin" replace />
}
