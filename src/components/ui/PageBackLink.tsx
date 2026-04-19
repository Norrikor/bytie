import type { ReactNode } from 'react'
import Link from 'next/link'

type PageBackLinkProps = {
  href: string
  children: ReactNode
  className?: string
}

/** Ссылка назад по стилю — как компактная кнопка (`btnIcon` / охра-слой `.pageBackLink` в globals). */
export default function PageBackLink({ href, children, className }: PageBackLinkProps) {
  return (
    <Link
      href={href}
      className={['btnIcon', 'btnIcon--accent', 'pageBackLink', className].filter(Boolean).join(' ')}
    >
      {children}
    </Link>
  )
}
