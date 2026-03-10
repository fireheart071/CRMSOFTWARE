'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import LeadForm from '@/components/LeadForm'
import LeadList from '@/components/LeadList'

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads, setLeads] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(data)
  }

  const handleLeadAdded = () => {
    setShowForm(false)
    fetchLeads()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">CRM Dashboard</Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {session?.user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-8 2xl:px-12">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showForm ? 'Cancel' : 'Add Lead'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <LeadForm onLeadAdded={handleLeadAdded} />
            </div>
          )}

          <LeadList leads={leads} onLeadUpdated={fetchLeads} />
        </div>
      </div>
    </div>
  )
}