import React, { useState } from 'react'
import { 
  ArrowLeft, Plus, Search, Bell, Phone, Mail, MessageSquare, Calendar, 
  Users, UserPlus, Edit, StopCircle, Download, FileText, Clock,
  CheckCircle, AlertCircle, MapPin, Briefcase
} from 'lucide-react'
import type { ContactPerson, CommunicationLog } from '../data/mockCooperationData'
import { 
  generateMockContactPersons, 
  generateMockCommunicationLogs,
  CONTACT_ROLES,
  COMMUNICATION_TYPES,
} from '../data/mockCooperationData'

/**
 * Contact Person Management View (功能点 3.5)
 * Manage insurer contact persons across different roles and maintain communication logs
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function ContactPersonManagementView({ navigateTo }: Props) {
  const contacts = generateMockContactPersons()
  const logs = generateMockCommunicationLogs()
  
  // State
  const [selectedContactId, setSelectedContactId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByRole, setFilterByRole] = useState('ALL')
  const [filterByStatus, setFilterByStatus] = useState('ALL')
  const [logTypeFilter, setLogTypeFilter] = useState<'ALL' | 'Phone' | 'Email' | 'Meeting' | 'SiteVisit'>('ALL')
  
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery)
    const matchesRole = filterByRole === 'ALL' || contact.role === filterByRole
    const matchesStatus = filterByStatus === 'ALL' || 
                          (filterByStatus === 'ACTIVE' ? contact.isActive : !contact.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })
  
  const selectedContact = contacts.find(c => c.id === selectedContactId)
  
  // Get logs for selected contact
  const contactLogs = selectedContactId ? 
    logs.filter(log => log.contactPersonId === selectedContactId) : []
  
  const handleAddContact = () => {
    alert('Add New Contact Modal - To be implemented')
  }
  
  const handleEditContact = (contact: ContactPerson) => {
    alert(`Edit Contact: ${contact.fullName}`)
  }
  
  const handleDeactivate = (contact: ContactPerson) => {
    if (confirm(`Deactivate ${contact.fullName}?`)) {
      alert('Contact deactivated successfully!')
    }
  }
  
  const handleActivate = (contact: ContactPerson) => {
    alert(`Activate ${contact.fullName}`)
  }
  
  const handleExportLogs = () => {
    if (!selectedContactId) {
      alert('Please select a contact first')
      return
    }
    alert(`Exporting ${contactLogs.length} communication logs...`)
  }
  
  const getRoleLabel = (role: string): string => {
    const roleInfo = CONTACT_ROLES.find(r => r.value === role)
    return roleInfo?.label || role
  }
  
  const getLogTypeLabel = (type: string): string => {
    const typeInfo = COMMUNICATION_TYPES.find(t => t.value === type)
    return typeInfo?.label || type
  }
  
  const isContactSelected = selectedContactId !== ''
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-blue-600" size={28}/>
          Contact Person Management
        </h1>
        <p className="text-gray-600 mt-1">Manage insurer contact persons across all functional roles</p>
      </div>
      
      {/* Quick Stats */}
      <div className="max-w-[1600px] mx-auto mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={contacts.length.toString()} icon={<Users className="text-blue-600"/>} />
        <StatCard label="Active" value={contacts.filter(c => c.isActive).length.toString()} icon={<CheckCircle className="text-green-600"/>} />
        <StatCard label="Account Managers" value={contacts.filter(c => c.role === 'AccountManager').length.toString()} icon={<UserPlus className="text-purple-600"/>} />
        <StatCard label="Recent Logs" value={logs.filter(l => new Date(l.logDate).getDate() >= new Date().getDate() - 7).length.toString()} icon={<MessageSquare className="text-orange-600"/>} />
      </div>
      
      {/* Main Layout - Two Column Split */}
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-220px)]">
        {/* Left Panel - Contact List */}
        <div className="w-1/3 border-r border-gray-200 pr-4 flex flex-col">
          {/* Header Actions */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleAddContact}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus size={18}/> Add Contact
              </button>
              <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                <Download size={18}/> Export
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterByRole}
                onChange={(e) => setFilterByRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="ALL">All Roles</option>
                {CONTACT_ROLES.map(role => (
                  <option key={role.value} value={role.value}>{getRoleLabel(role.value)}</option>
                ))}
              </select>
              
              <select
                value={filterByStatus}
                onChange={(e) => setFilterByStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>
          
          {/* Contact List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedContactId === contact.id 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{contact.fullName}</div>
                  {contact.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-1">
                  <div className="flex items-center gap-1">
                    <Briefcase size={14}/>
                    {contact.position} - {getRoleLabel(contact.role)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14}/>
                    {contact.department}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Mail size={12}/>
                    {contact.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={12}/>
                    {contact.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Info Note */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-800">
              <strong>Note:</strong> Select a contact to view details and communication history
            </div>
          </div>
        </div>
        
        {/* Right Panel - Contact Details & Logs */}
        <div className="w-2/3 pl-6">
          {!isContactSelected ? (
            <EmptyState/>
          ) : (
            <ContactDetailPanel
              contact={selectedContact!}
              contactLogs={contactLogs}
              onEdit={handleEditContact}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              exportLogs={handleExportLogs}
              logTypeFilter={logTypeFilter}
              setLogTypeFilter={setLogTypeFilter}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State Component
const EmptyState = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <Users className="mx-auto text-gray-300 mb-4" size={64}/>
      <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Contact Person</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Choose a contact from the list to view their details, contact information, and communication history
      </p>
    </div>
  </div>
)

// Contact Detail Panel Component
interface ContactDetailPanelProps {
  contact: ContactPerson
  contactLogs: CommunicationLog[]
  onEdit: (contact: ContactPerson) => void
  onDeactivate: (contact: ContactPerson) => void
  onActivate: (contact: ContactPerson) => void
  exportLogs: () => void
  logTypeFilter: string
  setLogTypeFilter: (type: string) => void
}

const ContactDetailPanel = ({
  contact,
  contactLogs,
  onEdit,
  onDeactivate,
  onActivate,
  exportLogs,
  logTypeFilter,
  setLogTypeFilter,
}: ContactDetailPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{contact.fullName}</h2>
            <p className="text-sm text-gray-600 mt-1">{contact.position} - {contact.department}</p>
          </div>
          <div className="flex gap-2">
            {contact.isActive ? (
              <button
                onClick={() => onDeactivate(contact)}
                className="px-3 py-1.5 rounded-lg border border-red-500 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <StopCircle size={16}/> Deactivate
              </button>
            ) : (
              <button
                onClick={() => onActivate(contact)}
                className="px-3 py-1.5 rounded-lg border border-green-500 text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16}/> Activate
              </button>
            )}
            <button
              onClick={() => onEdit(contact)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit size={16}/> Edit
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-3">
              <DetailRow icon={<Mail size={18}/>} label="Email" value={contact.email}/>
              <DetailRow icon={<Phone size={18}/>} label="Direct Phone" value={contact.phone}/>
              {contact.mobilePhone && (
                <DetailRow icon={<Phone size={18}/>} label="Mobile" value={contact.mobilePhone}/>
              )}
              {contact.officeAddress && (
                <DetailRow icon={<MapPin size={18}/>} label="Office Address" value={contact.officeAddress}/>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Professional Details</h4>
            <div className="space-y-3">
              <DetailRow icon={<Briefcase size={18}/>} label="Position" value={contact.position}/>
              <DetailRow icon={<Users size={18}/>} label="Department" value={contact.department}/>
              <DetailRow icon={<UserPlus size={18}/>} label="Role" value={getRoleLabel(contact.role)}/>
              <DetailRow label="Primary Contact" value={contact.isPrimary ? 'Yes' : 'No'}/>
              <DetailRow label="Status" value={contact.isActive ? 'Active' : 'Inactive'}/>
            </div>
          </div>
        </div>
        
        {/* Export Logs Button */}
        {contactLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={16}/> Export {contactLogs.length} Communication Logs
            </button>
          </div>
        )}
      </div>
      
      {/* Communication Logs Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={20}/>
            Communication History
            <span className="text-sm font-normal text-gray-500">({contactLogs.length} total)</span>
          </h3>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
              + Log Communication
            </button>
            <button
              onClick={() => setLogTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg border text-xs ${
                logTypeFilter === 'ALL' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setLogTypeFilter('Phone')}
              className={`px-3 py-1.5 rounded-lg border text-xs ${
                logTypeFilter === 'Phone' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-gray-300'
              }`}
            >
              Calls
            </button>
            <button
              onClick={() => setLogTypeFilter('Email')}
              className={`px-3 py-1.5 rounded-lg border text-xs ${
                logTypeFilter === 'Email' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
              }`}
            >
              Emails
            </button>
          </div>
        </div>
        
        {contactLogs.length === 0 ? (
          <EmptyLogsList/>
        ) : (
          <div className="space-y-3">
            {contactLogs
              .filter(log => logTypeFilter === 'ALL' || log.logType === logTypeFilter)
              .map(log => (
                <LogItem key={log.id} log={log}/>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Detail Row Component
const DetailRow = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    {icon && <div className="mt-0.5 opacity-60">{icon}</div>}
    <div className="flex-1">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  </div>
)

// Log Item Component
const LogItem = ({ log }: { log: CommunicationLog }) => {
  const isOverdue = log.followUpDate && new Date(log.followUpDate) < new Date() && !log.resolved
  
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {log.logType === 'Phone' && <Phone className="text-orange-500" size={18}/>}
          {log.logType === 'Email' && <Mail className="text-blue-500" size={18}/>}
          {log.logType === 'Meeting' && <Calendar className="text-green-500" size={18}/>}
          <span className="text-sm font-medium text-gray-900">{getLogTypeLabel(log.logType)}</span>
        </div>
        <span className="text-xs text-gray-500">{new Date(log.logDate).toLocaleDateString()}</span>
      </div>
      
      {log.subject && (
        <div className="font-medium text-gray-900 mb-1">{log.subject}</div>
      )}
      
      <p className="text-sm text-gray-700 mb-3">{log.content}</p>
      
      {log.participants && log.participants.length > 0 && (
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Users size={14}/>
          {log.participants.join(', ')}
        </div>
      )}
      
      {log.followUpTask && (
        <div className={`text-xs p-2 rounded ${
          isOverdue 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          <div className="flex items-start gap-1">
            <AlertCircle className="mt-0.5 flex-shrink-0" size={14}/>
            <span><strong>Follow-up:</strong> {log.followUpTask}</span>
          </div>
          {log.followUpDate && (
            <div className="text-right text-gray-600 mt-1">
              Due: {new Date(log.followUpDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Empty Logs List
const EmptyLogsList = () => (
  <div className="text-center py-8">
    <FileText className="mx-auto text-gray-300 mb-3" size={48}/>
    <p className="text-gray-600">No communication logs yet</p>
    <p className="text-sm text-gray-500 mt-1">Add your first communication log above</p>
  </div>
)

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string
  value: string
  icon: React.ReactNode
}) => (
  <div className="card p-4 bg-white">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
        <div className="text-2xl font-bold mt-1 text-gray-900">{value}</div>
      </div>
      <div className="flex-shrink-0 opacity-80">{icon}</div>
    </div>
  </div>
)

// Constants
const CONTACT_ROLES = [
  { value: 'AccountManager', label: 'Account Manager' },
  { value: 'Underwriting', label: 'Underwriting Contact' },
  { value: 'Claims', label: 'Claims Contact' },
  { value: 'Finance', label: 'Finance Contact' },
  { value: 'IT', label: 'Technical Contact' },
  { value: 'Compliance', label: 'Compliance Contact' },
  { value: 'Executive', label: 'Executive Contact' },
] as const

const COMMUNICATION_TYPES = [
  { value: 'Phone', label: 'Phone Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'IM', label: 'Instant Messaging' },
  { value: 'SiteVisit', label: 'On-site Visit' },
] as const
