import React, { useState } from 'react'
import type { ViewId } from '@/App'
import Toast from '@/components/SuccessToast'
import type { Notify } from './cooperation/constants'
import CooperationListView from './cooperation/CooperationListView'
import CooperationDetailView from './cooperation/CooperationDetailView'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

type Route = { view: 'list' } | { view: 'detail'; id: string }

/**
 * V1.0.10 ch.10 prototype alignment: the former 7 module-level tabs are now
 * a cooperation list (module home) plus a per-cooperation detail page.
 */
export default function CooperationManagementView({ navigateTo }: Props) {
  const [route, setRoute] = useState<Route>({ view: 'list' })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const notify: Notify = (type, message) => setToast({ type, message })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {route.view === 'list' ? (
        <CooperationListView notify={notify} onSelect={id => setRoute({ view: 'detail', id })} />
      ) : (
        <CooperationDetailView
          partnershipId={route.id}
          notify={notify}
          navigateTo={navigateTo}
          onBack={() => setRoute({ view: 'list' })}
        />
      )}
    </div>
  )
}
