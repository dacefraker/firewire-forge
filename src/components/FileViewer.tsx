import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X, Wand2, ArrowLeft } from 'lucide-react';
import { FileRecord } from './FileUploader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import PageSelector from './enhancement/PageSelector';
import EnhancementCanvas from './enhancement/EnhancementCanvas';
import EnhancementControls from './enhancement/EnhancementControls';
import { EnhancementSettings } from '@/lib/enhancement/canvasFilters';
import { saveEnhancedImage } from '@/lib/enhancement/fileSaver';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface FileViewerProps {
  file: FileRecord | null;
  fileUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  projectId?: string;
  onFilesSaved?: () => void;
}

const FileViewer = ({ file, fileUrl, isOpen, onClose, onDownload, projectId, onFilesSaved }: FileViewerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // View mode state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhancement mode state
  const [enhancementMode, setEnhancementMode] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentEnhancementPage, setCurrentEnhancementPage] = useState(0);
  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSettings>({
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    threshold: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

  const isPDF = file?.mime_type === 'application/pdf';
  const isImage = file?.mime_type?.startsWith('image/');
  const canEnhance = (isPDF || isImage) && projectId;

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. The file may be corrupted or unsupported.');
    setIsLoading(false);
  }, []);

  const handlePreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleClose = () => {
    setPageNumber(1);
    setScale(1.0);
    setError(null);
    setEnhancementMode(false);
    setSelectedPages([]);
    setCurrentEnhancementPage(0);
    setEnhancementSettings({
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      threshold: 0,
    });
    onClose();
  };

  const handleEnhanceClick = () => {
    if (isPDF && fileUrl) {
      setShowPageSelector(true);
    } else if (isImage) {
      setSelectedPages([1]);
      setCurrentEnhancementPage(0);
      setEnhancementMode(true);
    }
  };

  const handlePagesSelected = (pages: number[]) => {
    setSelectedPages(pages);
    setCurrentEnhancementPage(0);
    setEnhancementMode(true);
  };

  const handleCanvasReady = (canvas: HTMLCanvasElement, originalData: ImageData) => {
    canvasRef.current = canvas;
    originalImageDataRef.current = originalData;
  };

  const handleResetSettings = () => {
    setEnhancementSettings({
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      threshold: 0,
    });
  };

  const handleSaveEnhanced = async () => {
    if (!canvasRef.current || !file || !projectId || !user) return;

    try {
      setIsSaving(true);
      setSaveProgress(0);

      const pagesToProcess = selectedPages.length > 0 ? selectedPages : [1];
      
      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageNum = pagesToProcess[i];
        setSaveProgress(Math.round((i / pagesToProcess.length) * 100));

        // For multi-page PDFs, we need to process each page
        // For images, just save once
        const pageNumber = isPDF ? pageNum : undefined;
        
        await saveEnhancedImage(
          canvasRef.current,
          file,
          projectId,
          user.id,
          pageNumber
        );
      }

      setSaveProgress(100);
      
      toast({
        title: "Enhancement Complete",
        description: `${pagesToProcess.length} ${pagesToProcess.length === 1 ? 'file' : 'files'} enhanced successfully!`,
      });

      // Refresh file list
      onFilesSaved?.();

      // Exit enhancement mode
      setEnhancementMode(false);
      setSelectedPages([]);
      setCurrentEnhancementPage(0);
      handleResetSettings();
    } catch (error: any) {
      console.error('Error saving enhanced file:', error);
      toast({
        title: "Enhancement Failed",
        description: error.message || "Failed to save enhanced file.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handleNextEnhancementPage = () => {
    if (currentEnhancementPage < selectedPages.length - 1) {
      setCurrentEnhancementPage(currentEnhancementPage + 1);
    }
  };

  const handlePrevEnhancementPage = () => {
    if (currentEnhancementPage > 0) {
      setCurrentEnhancementPage(currentEnhancementPage - 1);
    }
  };

  const exitEnhancementMode = () => {
    setEnhancementMode(false);
    setSelectedPages([]);
    setCurrentEnhancementPage(0);
    handleResetSettings();
  };

  if (!file || !fileUrl) return null;

  return (
    <>
      {/* Page Selector Dialog */}
      {isPDF && fileUrl && (
        <PageSelector
          open={showPageSelector}
          onOpenChange={setShowPageSelector}
          pdfUrl={fileUrl}
          onPagesSelected={handlePagesSelected}
        />
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold truncate pr-4">
                {enhancementMode ? 'Enhance Image' : file.filename}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Controls Bar */}
            {!enhancementMode && (
              <div className="flex items-center gap-2 mt-4">
                {isPDF && numPages && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {pageNumber} of {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pageNumber >= numPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                <div className="flex-1" />
                
                {(isPDF || isImage) && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {canEnhance && (
                  <Button variant="outline" size="sm" onClick={handleEnhanceClick}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Enhance
                  </Button>
                )}
                
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}

            {/* Enhancement Mode Header */}
            {enhancementMode && (
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={exitEnhancementMode}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to View
                </Button>
                
                <div className="flex-1" />
                
                {selectedPages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevEnhancementPage}
                      disabled={currentEnhancementPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {currentEnhancementPage + 1} of {selectedPages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextEnhancementPage}
                      disabled={currentEnhancementPage === selectedPages.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Content Area */}
          {!enhancementMode ? (
            <div className="flex-1 overflow-auto bg-muted/30 p-6">
              <div className="flex justify-center">
                {error && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={onDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download File Instead
                    </Button>
                  </div>
                )}

                {!error && isPDF && (
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading PDF...</p>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg"
                    />
                  </Document>
                )}

                {!error && isImage && (
                  <div className="max-w-full">
                    <img
                      src={fileUrl}
                      alt={file.filename}
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        maxWidth: '100%',
                        height: 'auto'
                      }}
                      className="shadow-lg rounded-lg"
                    />
                  </div>
                )}

                {!error && !isPDF && !isImage && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Preview not available for this file type
                    </p>
                    <Button onClick={onDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-6 bg-background">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Canvas Preview */}
                <div className="lg:col-span-2">
                  <EnhancementCanvas
                    fileUrl={fileUrl}
                    isPDF={isPDF}
                    currentPage={selectedPages[currentEnhancementPage] || 1}
                    settings={enhancementSettings}
                    onCanvasReady={handleCanvasReady}
                  />
                  {selectedPages.length > 0 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        {isPDF ? `Page ${selectedPages[currentEnhancementPage]}` : 'Image Enhancement'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhancement Controls */}
                <div className="lg:col-span-1">
                  <EnhancementControls
                    settings={enhancementSettings}
                    onSettingsChange={setEnhancementSettings}
                    onReset={handleResetSettings}
                    onSave={handleSaveEnhanced}
                    isSaving={isSaving}
                    saveProgress={saveProgress}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileViewer;
