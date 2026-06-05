'use client'

import { useState } from 'react'

export function InviteJoiner() {
  const [link, setLink] = useState('')

  const handleJoin = () => {
    if (link.trim().includes('http')) {
      window.location.href = link.trim()
    }
  }

  return (
    <div className="w-full space-y-2">
      <label htmlFor="invite-link" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        Lien d&apos;invitation
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="invite-link"
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Coller le lien ici..."
          className="flex-1 h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleJoin()
            }
          }}
        />
        <button
          onClick={handleJoin}
          className="h-12 px-6 rounded-2xl bg-zinc-900 text-white font-bold text-sm shadow-xl shadow-zinc-900/10 hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          Rejoindre
        </button>
      </div>
    </div>
  )
}
