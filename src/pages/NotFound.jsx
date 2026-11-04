import { Link } from 'react-router-dom'
import Logo from '../components/common/Logo'
import Button from '../components/common/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <Logo withText={false} />
      <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
        This page is off the board
      </h1>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        The link you followed doesn't lead to a market. Check the address, or head back to the
        main event.
      </p>
      <Link to="/home" className="mt-8">
        <Button size="lg">Back to Home</Button>
      </Link>
    </div>
  )
}
