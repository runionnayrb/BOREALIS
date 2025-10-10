import TrainingCard from '../TrainingCard'

export default function TrainingCardExample() {
  return (
    <TrainingCard
      id="1"
      actName="High Dive"
      startTime="14:00"
      endTime="16:30"
      durationMinutes={150}
      departments={[
        { departmentName: "Rigging", leadName: "Sarah Johnson", notes: "Check harness tension" },
        { departmentName: "Safety", leadName: "Mike Chen" },
      ]}
      scheduledFor="Today at 2:00 PM"
      onEdit={() => console.log('Edit training')}
      onDelete={() => console.log('Delete training')}
    />
  )
}
