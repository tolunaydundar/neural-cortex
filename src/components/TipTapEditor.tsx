import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { CustomImage as Image } from './extensions/TipTapImage';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../utils/storage';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-surface-container-lowest sticky top-0 z-10 rounded-t-sm">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Bold"
      >
        <span className="material-symbols-outlined text-[18px]">format_bold</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Italic"
      >
        <span className="material-symbols-outlined text-[18px]">format_italic</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Strikethrough"
      >
        <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
      </button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Heading 1"
      >
        <span className="font-label-caps text-[12px] font-bold">H1</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Heading 2"
      >
        <span className="font-label-caps text-[12px] font-bold">H2</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Bullet List"
      >
        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Ordered List"
      >
        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('taskList') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Task List"
      >
        <span className="material-symbols-outlined text-[18px]">checklist</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Blockquote"
      >
        <span className="material-symbols-outlined text-[18px]">format_quote</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface-variant hover:bg-white/5'}`}
        title="Code Block"
      >
        <span className="material-symbols-outlined text-[18px]">code_blocks</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <label
        className={`p-1.5 rounded transition-colors text-on-surface-variant hover:bg-white/5 cursor-pointer flex items-center justify-center ${isUploading ? 'opacity-50' : ''}`}
        title="Upload Image"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isUploading ? 'hourglass_empty' : 'image'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !currentUser) {
              if (!currentUser) {
                // Fallback to URL if not logged in
                const url = window.prompt('URL');
                if (url) editor.chain().focus().setImage({ src: url }).run();
              }
              return;
            }
            setIsUploading(true);
            try {
              const path = `users/${currentUser.uid}/images/${Date.now()}_${file.name}`;
              const url = await uploadFile(file, path);
              editor.chain().focus().setImage({ src: url }).run();
            } catch (err) {
              console.error('Upload failed', err);
            } finally {
              setIsUploading(false);
              e.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
};

export default function TipTapEditor({ content, onChange, placeholder = 'Start typing...', readOnly = false }: TipTapEditorProps) {
  // We parse existing markdown using a basic strategy if needed, but since we're using tiptap,
  // TipTap handles HTML out of the box. For markdown, we'll just treat it as text if it's not HTML,
  // or use a markdown parser if we want to be fancy. For now, TipTap's StarterKit handles basic HTML.
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Always output HTML from TipTap to save it.
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:my-2 prose-headings:my-4 prose-a:text-primary-fixed-dim prose-code:text-primary-fixed-dim max-w-none focus:outline-none min-h-[300px] p-4 text-sm lg:text-base leading-relaxed',
      },
    },
  });

  // Update content if it changes externally (e.g., loading a new note)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Be careful not to reset cursor position if the user is typing
      // So only set content if the editor is completely empty, or if we strictly need to sync
      // TipTap's `content` option handles initial content, but for dynamic updates:
      if (!editor.isFocused) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col w-full h-full border border-white/10 rounded-sm bg-surface-container-lowest overflow-hidden">
      {!readOnly && <MenuBar editor={editor} />}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
