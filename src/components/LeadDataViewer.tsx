'use client'

import { useState, useEffect } from 'react'
import { X, Eye } from 'lucide-react'

interface Lead {
  id: string
  clientName: string
  phone: string
  dealValue: number | null
  assignedUser: { name: string }
  stage: string
}

interface StageData {
  id: string
  leadId: string
  stage: string
  data: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface LeadDataViewerProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
}

const stageLabels = {
  FIND_LEADS: 'Find Leads',
  CONTACT_CLIENT: 'Contact Client',
  PRESENT_SERVICE: 'Present Service',
  NEGOTIATE: 'Negotiate',
  CLOSE_DEAL: 'Close Deal',
  PAYMENT: 'Payment',
  CLIENT_RETENTION: 'Client Retention'
}

const stageColors = {
  FIND_LEADS: 'bg-blue-100 border-blue-300',
  CONTACT_CLIENT: 'bg-yellow-100 border-yellow-300',
  PRESENT_SERVICE: 'bg-purple-100 border-purple-300',
  NEGOTIATE: 'bg-orange-100 border-orange-300',
  CLOSE_DEAL: 'bg-green-100 border-green-300',
  PAYMENT: 'bg-emerald-100 border-emerald-300',
  CLIENT_RETENTION: 'bg-indigo-100 border-indigo-300'
}

export default function LeadDataViewer({ lead, isOpen, onClose }: LeadDataViewerProps) {
  const [stageData, setStageData] = useState<StageData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && lead) {
      fetchStageData()
    }
  }, [isOpen, lead])

  const fetchStageData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/stage-data?leadId=${lead.id}`)
      if (response.ok) {
        const data = await response.json()
        setStageData(data)
      }
    } catch (error) {
      console.error('Error fetching stage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (key: string, value: any) => {
    if (!value) return 'Not specified'

    // Format dates
    if (key.toLowerCase().includes('date') && value) {
      return new Date(value).toLocaleDateString()
    }

    // Format currency
    if (key.toLowerCase().includes('value') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('contractvalue') || key === 'contractValue') {
      return `GHS ${Number(value).toLocaleString()}`
    }

    // Format ratings
    if (key.toLowerCase().includes('rating') || key.toLowerCase().includes('satisfaction')) {
      return `${value}/5`
    }

    return value
  }

  const getFieldLabel = (key: string): string => {
    // Special case for contractValue in CLOSE_DEAL stage
    const fieldLabelMap: Record<string, string> = {
      contractValue: 'Deal Amount',
      leadSource: 'Lead Source',
      initialContact: 'Initial Contact Method',
      leadQuality: 'Lead Quality',
      discoveryNotes: 'Discovery Notes',
      contactDate: 'Contact Date',
      contactMethod: 'Contact Method',
      responseType: 'Response Type',
      contactNotes: 'Contact Notes',
      followUpDate: 'Follow-up Date',
      presentationDate: 'Presentation Date',
      presentationMethod: 'Presentation Method',
      materialsUsed: 'Materials Used',
      clientInterest: 'Client Interest Level',
      presentationNotes: 'Presentation Notes',
      nextSteps: 'Next Steps',
      negotiationStartDate: 'Negotiation Start Date',
      keyObjections: 'Key Objections',
      proposedTerms: 'Proposed Terms',
      counteroffers: 'Counteroffers Made',
      negotiationStatus: 'Negotiation Status',
      negotiationNotes: 'Negotiation Notes',
      closingDate: 'Expected Closing Date',
      finalTerms: 'Final Terms Agreed',
      paymentTerms: 'Payment Terms',
      specialConditions: 'Special Conditions',
      closingNotes: 'Closing Notes',
      invoiceDate: 'Invoice Date',
      invoiceNumber: 'Invoice Number',
      paymentDueDate: 'Payment Due Date',
      paymentStatus: 'Payment Status',
      amountReceived: 'Amount Received',
      paymentMethod: 'Payment Method',
      paymentNotes: 'Payment Notes',
      onboardingDate: 'Onboarding Completion Date',
      satisfactionRating: 'Client Satisfaction',
      retentionNotes: 'Retention Notes',
      followUpSchedule: 'Follow-up Schedule',
      upsellOpportunities: 'Upsell Opportunities',
      contractRenewalDate: 'Contract Renewal Date'
    }
    return fieldLabelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  const renderStageData = (stageDataItem: StageData) => {
    const data = stageDataItem.data
    const stageName = stageLabels[stageDataItem.stage as keyof typeof stageLabels] || stageDataItem.stage

    return (
      <div key={stageDataItem.id} className={`p-4 rounded-lg border-2 mb-4 ${stageColors[stageDataItem.stage as keyof typeof stageColors]}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{stageName}</h3>
          <span className="text-sm text-gray-500">
            Updated: {new Date(stageDataItem.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-600">
                {getFieldLabel(key)}
              </div>
              <div className="text-sm text-gray-800 mt-1">
                {formatValue(key, value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lead.clientName}</h2>
            <p className="text-gray-600">Complete Stage Data History</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lead Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">Phone</div>
              <div className="text-sm text-gray-800">{lead.phone}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Deal Value</div>
              <div className="text-sm text-gray-800">
                {lead.dealValue ? `GHS ${lead.dealValue.toLocaleString()}` : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Current Stage</div>
              <div className="text-sm text-gray-800">
                {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Assigned To</div>
              <div className="text-sm text-gray-800">{lead.assignedUser.name}</div>
            </div>
          </div>
        </div>

        {/* Stage Data */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading stage data...</p>
          </div>
        ) : stageData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye size={48} className="mx-auto mb-4 opacity-50" />
            <p>No stage data has been recorded for this lead yet.</p>
            <p className="text-sm mt-2">Click on the lead in the pipeline to add stage-specific information.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stageData.map(renderStageData)}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}