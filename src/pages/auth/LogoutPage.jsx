import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'

export default function LogoutPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    logout()
    navigate('/welcome', { replace: true })
  }, [logout, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <Spinner label="Logging you out" />
    </div>
  )
}
