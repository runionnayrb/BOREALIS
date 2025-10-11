import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  minHeight?: string;
}

export default function RichTextEditor({ content = '', onChange, minHeight = 'min-h-64' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  };

  return (
    <div className="border border-border rounded-md">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-9 h-9 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          data-testid="button-bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-9 h-9 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
          data-testid="button-italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-9 h-9 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
          data-testid="button-underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-9 h-9 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
          data-testid="button-bullet-list"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-9 h-9 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
          data-testid="button-ordered-list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`w-9 h-9 ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}
          data-testid="button-align-left"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`w-9 h-9 ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}
          data-testid="button-align-center"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`w-9 h-9 ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}
          data-testid="button-align-right"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Select onValueChange={setFontSize}>
          <SelectTrigger className="w-24 h-9" data-testid="select-font-size">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12px">12px</SelectItem>
            <SelectItem value="14px">14px</SelectItem>
            <SelectItem value="16px">16px</SelectItem>
            <SelectItem value="18px">18px</SelectItem>
            <SelectItem value="20px">20px</SelectItem>
            <SelectItem value="24px">24px</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div 
        onClick={() => editor.commands.focus()}
        className="cursor-text"
      >
        <EditorContent
          editor={editor}
          className={`prose prose-sm max-w-none p-4 ${minHeight} focus:outline-none [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0 [&_li]:mb-1 text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_ul]:text-foreground [&_ol]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_u]:text-foreground [&_s]:text-foreground`}
          data-testid="editor-content"
        />
      </div>
    </div>
  );
}
