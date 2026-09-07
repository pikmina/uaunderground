import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo 
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded border-2 border-black transition-colors cursor-pointer ${
      isActive ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
    }`;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-zinc-200 border-b-4 border-black rounded-t-xl">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run()}}
        className={btnClass(editor.isActive("bold"))}
        title="Negrita"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run()}}
        className={btnClass(editor.isActive("italic"))}
        title="Cursiva"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run()}}
        className={btnClass(editor.isActive("strike"))}
        title="Tachado"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-black mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run()}}
        className={btnClass(editor.isActive("heading", { level: 1 }))}
        title="Título 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run()}}
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-black mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run()}}
        className={btnClass(editor.isActive("bulletList"))}
        title="Lista de viñetas"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run()}}
        className={btnClass(editor.isActive("orderedList"))}
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run()}}
        className={btnClass(editor.isActive("blockquote"))}
        title="Cita"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-black mx-1 self-center" />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run()}}
        className={btnClass(false)}
        title="Deshacer"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run()}}
        className={btnClass(false)}
        title="Rehacer"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base focus:outline-none max-w-none p-4 min-h-[150px]",
      },
    },
  });

  // Re-sync initial content if it completely changes from outside (e.g., editing a different post)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border-4 border-black rounded-xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
};
