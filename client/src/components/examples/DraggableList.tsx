import DraggableList from '../DraggableList'
import { useState } from 'react'
import { Card } from '@/components/ui/card'

export default function DraggableListExample() {
  const [items, setItems] = useState<Array<{ id: string; content: React.ReactNode }>>([
    { id: '1', content: <Card className="p-3 flex-1"><p>High Dive</p></Card> },
    { id: '2', content: <Card className="p-3 flex-1"><p>Wheel</p></Card> },
    { id: '3', content: <Card className="p-3 flex-1"><p>Finale</p></Card> },
  ])

  return (
    <DraggableList 
      items={items} 
      onReorder={(newItems) => {
        setItems(newItems)
        console.log('Reordered:', newItems)
      }} 
    />
  )
}
