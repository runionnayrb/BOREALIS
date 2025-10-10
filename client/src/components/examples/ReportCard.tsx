import ReportCard from '../ReportCard'

export default function ReportCardExample() {
  return (
    <ReportCard
      id="1"
      title="High Dive Training Report"
      date="Thursday, October 9, 2025"
      trainingsCount={3}
      onEdit={() => console.log('Edit clicked')}
      onDelete={() => console.log('Delete clicked')}
      onExport={() => console.log('Export clicked')}
    />
  )
}
