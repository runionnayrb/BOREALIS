import ReportHeader from '../ReportHeader'
import { useState } from 'react'

export default function ReportHeaderExample() {
  const [leftImage, setLeftImage] = useState('')
  const [title, setTitle] = useState('Training Report')
  const [rightImage, setRightImage] = useState('')

  return (
    <ReportHeader
      leftImageUrl={leftImage}
      middleTitle={title}
      rightImageUrl={rightImage}
      dateString="Thursday, October 9, 2025"
      onLeftImageChange={setLeftImage}
      onMiddleTitleChange={setTitle}
      onRightImageChange={setRightImage}
    />
  )
}
