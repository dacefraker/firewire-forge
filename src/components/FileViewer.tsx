import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react';
import { FileRecord } from './FileUploader';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FileViewerProps {
  file: FileRecord | null;
  fileUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const FileViewer = ({ file, fileUrl, isOpen, onClose, onDownload }: FileViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPDF = file?.mime_type === 'application/pdf';
  const isImage = file?.mime_type?.startsWith('image/');

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
    onClose();
  };

  if (!file || !fileUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-4">
              {file.filename}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Controls Bar */}
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
            
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        {/* Content Area */}
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
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;
