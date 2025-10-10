import RichTextEditor from '../RichTextEditor'
import { useState } from 'react'

export default function RichTextEditorExample() {
  const [content, setContent] = useState('<p>Start typing your training notes here...</p>')
  
  return (
    <RichTextEditor 
      content={content} 
      onChange={(newContent) => {
        setContent(newContent)
        console.log('Content changed:', newContent)
      }} 
    />
  )
}
