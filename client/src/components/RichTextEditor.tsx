import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync content prop changes to editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`w-9 h-9 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
          data-testid="button-strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              data-testid="button-text-color"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-5 gap-2">
              {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#808080'].map(color => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-8 h-8 rounded border border-border hover-elevate active-elevate-2"
                  style={{ backgroundColor: color }}
                  data-testid={`color-${color}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              data-testid="button-highlight"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-5 gap-2">
              {['#FFFF00', '#00FFFF', '#FF00FF', '#90EE90', '#FFA500', '#FFB6C1', '#E6E6FA', '#F0E68C', '#DDA0DD', '#D3D3D3'].map(color => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-8 h-8 rounded border border-border hover-elevate active-elevate-2"
                  style={{ backgroundColor: color }}
                  data-testid={`highlight-${color}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
          className={`prose prose-sm max-w-none p-4 ${minHeight} focus:outline-none [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0 [&_li]:mb-1 text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_ul]:text-foreground [&_ol]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_u]:text-foreground [&_s]:text-foreground [&_li::marker]:text-foreground [&_ul_li::marker]:text-foreground [&_ol_li::marker]:text-foreground [&_mark]:px-1 [&_mark]:rounded-sm`}
          data-testid="editor-content"
        />
      </div>
    </div>
  );
}
