import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
  originalIndex: number;
}

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onHeadingsUpdate?: (headings: HeadingItem[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function TipTapEditor({ content, onChange, onHeadingsUpdate, placeholder = 'Start typing...', readOnly = false }: TipTapEditorProps) {
  const { currentUser } = useAuth();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'scroll-mt-24', // for TOC scrolling offset
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      if (onHeadingsUpdate) {
        extractHeadings(editor);
      }
    },
    onCreate: ({ editor }) => {
      if (onHeadingsUpdate) {
        extractHeadings(editor);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:my-2 prose-headings:my-4 prose-a:text-primary-fixed-dim prose-code:text-primary-fixed-dim max-w-none focus:outline-none min-h-[500px] text-base lg:text-lg leading-relaxed text-on-surface/90',
      },
    },
  });

  const extractHeadings = (ed: Editor) => {
    const headings: HeadingItem[] = [];
    let headingIndex = 0;
    ed.state.doc.descendants((node: ProseMirrorNode) => {
      if (node.type.name === 'heading') {
        headings.push({
          id: `heading-${headingIndex}`,
          text: node.textContent,
          level: node.attrs.level,
          originalIndex: headingIndex
        });
        headingIndex++;
      }
    });
    onHeadingsUpdate?.(headings);
  };

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (!editor.isFocused) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col w-full h-full relative group">
      {!readOnly && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-1 bg-surface-container-highest/95 backdrop-blur-xl p-2 rounded-sm border border-on-surface/20 transition-all w-[90%] sm:w-auto justify-center">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <span className="font-label-caps text-[12px] font-bold">H1</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <span className="font-label-caps text-[12px] font-bold">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Heading 3"
            aria-label="Heading 3"
          >
            <span className="font-label-caps text-[12px] font-bold">H3</span>
          </button>

          <div className="w-px bg-on-surface/10 h-5 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('bold') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Bold"
            aria-label="Bold"
          >
            <span className="material-symbols-outlined text-[18px]">format_bold</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('italic') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Italic"
            aria-label="Italic"
          >
            <span className="material-symbols-outlined text-[18px]">format_italic</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('strike') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
          </button>
          
          <div className="w-px bg-on-surface/10 h-5 mx-1" />
          
          <button
            onClick={() => {
              const url = window.prompt('URL');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('link') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Link"
            aria-label="Link"
          >
            <span className="material-symbols-outlined text-[18px]">link</span>
          </button>
          
          <div className="w-px bg-on-surface/10 h-5 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Bullet List"
            aria-label="Bullet list"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('taskList') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Task List"
            aria-label="Task list"
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Code Block"
            aria-label="Code block"
          >
            <span className="material-symbols-outlined text-[18px]">code_blocks</span>
          </button>
        </div>
      )}
      
      <div className="flex-grow editor-container relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
