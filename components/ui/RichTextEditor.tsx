'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link, 
  Heading1, 
  Heading2, 
  Heading3,
  RemoveFormatting 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  className = '',
  maxLength = 1000,
}) => {
  const [mounted, setMounted] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textOnly = html.replace(/<[^>]*>/g, '');
      setCharCount(textOnly.length);
      if (textOnly.length <= maxLength) {
        onChange(html);
      } else {
        // Truncate to max length
        const truncated = textOnly.substring(0, maxLength);
        onChange(editor.getHTML().replace(/<[^>]*>/g, truncated));
      }
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] focus:outline-none prose prose-sm max-w-none',
      },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div className={`w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[200px] ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    active, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`rich-text-editor border border-gray-300 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            active={editor.isActive('link')}
            title="Add Link"
          >
            <Link className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Clear Formatting */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Character Count */}
      <div className="bg-white px-4 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-right">
          {charCount}/{maxLength} characters
        </div>
      </div>

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          height: 250px;
          overflow-y: auto;
          padding: 1rem;
        }
        .rich-text-editor .ProseMirror::-webkit-scrollbar {
          display: none;
        }
        .rich-text-editor .ProseMirror {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #111827;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .rich-text-editor .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .rich-text-editor .ProseMirror a {
          color: #2563EB;
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror strong {
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror em {
          font-style: italic;
        }
        .rich-text-editor .ProseMirror s {
          text-decoration: line-through;
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
