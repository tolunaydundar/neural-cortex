import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export default function TipTapImageNodeView({ node }: NodeViewProps) {
  const imageSrc = String(node.attrs.src || '');

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageSrc.split('?')[0].split('/').pop() || 'downloaded-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
      window.open(imageSrc, '_blank');
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
        src={imageSrc}
        alt={node.attrs.alt || 'Note image'}
        title={node.attrs.title}
        className="max-w-full rounded-sm border border-white/10"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="bg-black/60 hover:bg-black/90 text-white p-1.5 rounded-md flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer border border-white/20"
          title="Download Image"
          aria-label="Download image"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
        </button>
      </div>
    </NodeViewWrapper>
  );
}
