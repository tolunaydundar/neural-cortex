import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

const TipTapImageNodeView = ({ node }: NodeViewProps) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(node.attrs.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.attrs.src.split('?')[0].split('/').pop() || 'downloaded-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: just open in new tab
      window.open(node.attrs.src, '_blank');
    }
  };

  return (
    <NodeViewWrapper 
      className="relative inline-block group max-w-full my-4" 
      as="span" 
      draggable="true" 
      data-drag-handle
    >
      <img 
        src={node.attrs.src} 
        alt={node.attrs.alt || 'Note image'} 
        title={node.attrs.title}
        className="max-w-full rounded-sm border border-white/10" 
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="bg-black/60 hover:bg-black/90 text-white p-1.5 rounded-md flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer border border-white/20 shadow-lg"
          title="Download Image"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TipTapImageNodeView);
  },
});
