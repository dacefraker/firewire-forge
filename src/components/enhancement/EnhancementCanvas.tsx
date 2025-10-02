import { useEffect, useRef, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { applyAllFilters, EnhancementSettings } from '@/lib/enhancement/canvasFilters';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface EnhancementCanvasProps {
  fileUrl: string;
  isPDF: boolean;
  currentPage: number;
  settings: EnhancementSettings;
  onCanvasReady: (canvas: HTMLCanvasElement, originalData: ImageData) => void;
  scale?: number;
}

const EnhancementCanvas = ({
  fileUrl,
  isPDF,
  currentPage,
  settings,
  onCanvasReady,
  scale = 2.0
}: EnhancementCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Render PDF to canvas
  const renderPDFToCanvas = useCallback(async () => {
    if (!isPDF || !hiddenCanvasRef.current) return;

    try {
      setIsLoading(true);
      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load PDF
      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(currentPage);
      
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // Store original
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
      onCanvasReady(canvas, imageData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error rendering PDF:', error);
      setIsLoading(false);
    }
  }, [fileUrl, currentPage, isPDF, scale, onCanvasReady]);

  // Render image to canvas
  const renderImageToCanvas = useCallback(() => {
    if (isPDF || !hiddenCanvasRef.current) return;

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = hiddenCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
      onCanvasReady(canvas, imageData);
      setIsLoading(false);
    };

    img.onerror = () => {
      console.error('Error loading image');
      setIsLoading(false);
    };

    img.src = fileUrl;
  }, [fileUrl, isPDF, onCanvasReady]);

  // Initial render
  useEffect(() => {
    if (isPDF) {
      renderPDFToCanvas();
    } else {
      renderImageToCanvas();
    }
  }, [isPDF, renderPDFToCanvas, renderImageToCanvas]);

  // Apply filters with debouncing
  useEffect(() => {
    if (!originalImageData || !canvasRef.current || !hiddenCanvasRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce filter application
    timeoutRef.current = setTimeout(() => {
      const canvas = hiddenCanvasRef.current;
      const displayCanvas = canvasRef.current;
      if (!canvas || !displayCanvas) return;

      const ctx = canvas.getContext('2d');
      const displayCtx = displayCanvas.getContext('2d');
      if (!ctx || !displayCtx) return;

      // Apply filters
      const enhanced = applyAllFilters(originalImageData, settings);
      ctx.putImageData(enhanced, 0, 0);

      // Copy to display canvas
      displayCanvas.width = canvas.width;
      displayCanvas.height = canvas.height;
      displayCtx.drawImage(canvas, 0, 0);
    }, 300); // 300ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings, originalImageData]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for processing */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
      
      {/* Display canvas */}
      <div className="flex justify-center overflow-auto max-h-[60vh] bg-muted/30 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          className="shadow-lg max-w-full h-auto"
        />
      </div>
    </div>
  );
};

export default EnhancementCanvas;
