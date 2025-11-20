import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  minHeight?: string;
}

// Modern, theme-aware color palettes
const TEXT_COLORS = {
  neutrals: ['#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b'],
  blues: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
  greens: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
  ambers: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
  reds: ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  purples: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
};

const HIGHLIGHT_COLORS = {
  yellows: ['#fef08a', '#fde047', '#facc15'],
  greens: ['#bbf7d0', '#86efac', '#4ade80'],
  blues: ['#bfdbfe', '#93c5fd', '#60a5fa'],
  pinks: ['#fbcfe8', '#f9a8d4', '#f472b6'],
  purples: ['#e9d5ff', '#d8b4fe', '#c084fc'],
};

export default function RichTextEditor({ content = '', onChange, minHeight = 'min-h-64' }: RichTextEditorProps) {
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customHighlightColor, setCustomHighlightColor] = useState('#ffff00');
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
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 flex-1 h-full min-h-full overflow-auto focus:outline-none [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0 [&_li]:mb-1 text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_ul]:text-foreground [&_ol]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_u]:text-foreground [&_s]:text-foreground [&_li::marker]:text-foreground [&_ul_li::marker]:text-foreground [&_ol_li::marker]:text-foreground [&_mark]:px-1 [&_mark]:rounded-sm',
      },
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
    <div className="border border-border rounded-md flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30 flex-shrink-0">
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
          <PopoverContent className="w-80 p-0">
            <Tabs defaultValue="preset" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="preset" data-testid="tab-color-preset">Preset</TabsTrigger>
                <TabsTrigger value="custom" data-testid="tab-color-custom">Custom</TabsTrigger>
              </TabsList>
              <TabsContent value="preset" className="p-3 space-y-3">
                <div className="space-y-2">
                  <button
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="w-full h-9 px-3 rounded border border-border hover-elevate active-elevate-2 flex items-center justify-between text-sm"
                    data-testid="button-color-default"
                  >
                    <span>Default (System)</span>
                    <div className="w-6 h-6 rounded border border-border bg-gradient-to-r from-white to-black" />
                  </button>
                </div>
                {Object.entries(TEXT_COLORS).map(([category, colors]) => (
                  <div key={category} className="space-y-1">
                    <Label className="text-xs capitalize">{category}</Label>
                    <div className="flex gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => editor.chain().focus().setColor(color).run()}
                          className="w-8 h-8 rounded border border-border hover-elevate active-elevate-2"
                          style={{ backgroundColor: color }}
                          data-testid={`color-${color}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="custom" className="p-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-text-color">Custom Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-text-color"
                      type="color"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      data-testid="input-custom-text-color-picker"
                    />
                    <Input
                      type="text"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                      data-testid="input-custom-text-color-hex"
                    />
                  </div>
                  <Button
                    onClick={() => editor.chain().focus().setColor(customTextColor).run()}
                    className="w-full"
                    size="sm"
                    data-testid="button-apply-custom-text-color"
                  >
                    Apply Custom Color
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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
          <PopoverContent className="w-80 p-0">
            <Tabs defaultValue="preset" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="preset" data-testid="tab-highlight-preset">Preset</TabsTrigger>
                <TabsTrigger value="custom" data-testid="tab-highlight-custom">Custom</TabsTrigger>
              </TabsList>
              <TabsContent value="preset" className="p-3 space-y-3">
                <div className="space-y-2">
                  <button
                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                    className="w-full h-9 px-3 rounded border border-border hover-elevate active-elevate-2 flex items-center justify-between text-sm"
                    data-testid="button-highlight-default"
                  >
                    <span>No Highlight</span>
                    <div className="w-6 h-6 rounded border border-border bg-transparent" />
                  </button>
                </div>
                {Object.entries(HIGHLIGHT_COLORS).map(([category, colors]) => (
                  <div key={category} className="space-y-1">
                    <Label className="text-xs capitalize">{category}</Label>
                    <div className="flex gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                          className="w-8 h-8 rounded border border-border hover-elevate active-elevate-2"
                          style={{ backgroundColor: color }}
                          data-testid={`highlight-${color}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="custom" className="p-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-highlight-color">Custom Highlight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-highlight-color"
                      type="color"
                      value={customHighlightColor}
                      onChange={(e) => setCustomHighlightColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      data-testid="input-custom-highlight-color-picker"
                    />
                    <Input
                      type="text"
                      value={customHighlightColor}
                      onChange={(e) => setCustomHighlightColor(e.target.value)}
                      placeholder="#ffff00"
                      className="flex-1"
                      data-testid="input-custom-highlight-color-hex"
                    />
                  </div>
                  <Button
                    onClick={() => editor.chain().focus().toggleHighlight({ color: customHighlightColor }).run()}
                    className="w-full"
                    size="sm"
                    data-testid="button-apply-custom-highlight-color"
                  >
                    Apply Custom Highlight
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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
        className="cursor-text flex-1 flex flex-col min-h-0"
      >
        <EditorContent
          editor={editor}
          className="flex-1 flex flex-col h-full"
          data-testid="editor-content"
        />
      </div>
    </div>
  );
}
