import EmptyState from '../EmptyState'
import { FileText } from 'lucide-react'

export default function EmptyStateExample() {
  return (
    <EmptyState
      icon={FileText}
      title="No training reports yet"
      description="Create your first report to get started with training documentation"
      actionLabel="Create Report"
      onAction={() => console.log('Create report clicked')}
    />
  )
}
