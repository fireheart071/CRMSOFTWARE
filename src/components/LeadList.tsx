'use client'

import Link from 'next/link'

interface Lead {
  id: string
  clientName: string
  companyName: string | null
  phone: string
  email: string
  dealValue: number | null
  stage: string
  assignedUser: { name: string }
}

interface LeadListProps {
  leads: Lead[]
  onLeadUpdated: () => void
}

export default function LeadList({ leads, onLeadUpdated }: LeadListProps) {
  const stageLabels = {
    FIND_LEADS: 'Find Leads',
    CONTACT_CLIENT: 'Contact Client',
    PRESENT_SERVICE: 'Present Service',
    NEGOTIATE: 'Negotiate',
    CLOSE_DEAL: 'Close Deal',
    PAYMENT: 'Payment',
    CLIENT_RETENTION: 'Client Retention'
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {leads.map((lead) => (
          <li key={lead.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {lead.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{lead.clientName}</div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-900">{lead.phone}</div>
                  <div className="text-sm text-gray-500">GHS {lead.dealValue || 0}</div>
                  <div className="text-sm text-gray-500">{stageLabels[lead.stage as keyof typeof stageLabels]}</div>
                  <div className="text-sm text-gray-500">{lead.assignedUser.name}</div>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}