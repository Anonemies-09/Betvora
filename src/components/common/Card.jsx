import { cn } from '../../utils/cn'

export default function Card({ className, children, onClick, hoverable = false, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[14px] border border-royal-400/40 bg-royal shadow-[0_8px_18px_rgba(3,8,20,0.4)]',
        hoverable && 'card-glow hover:bg-royal-600 active:scale-[0.99]',
        onClick && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
