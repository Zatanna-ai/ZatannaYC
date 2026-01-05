'use client'

import { useState } from 'react'
import { CompaniesModal } from './CompaniesModal'

export function CompaniesModalClient() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-outline text-sm"
      >
        View Top Companies
      </button>
      <CompaniesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

