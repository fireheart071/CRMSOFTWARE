'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role === 'ADMIN') {
          router.replace('/dashboard')
        } else {
          router.replace('/pipeline')
        }
      } catch (e) {
        router.replace('/login')
      }
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}
