import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  onPagesSelected: (pages: number[]) => void;
}

const PageSelector = ({ open, onOpenChange, pdfUrl, onPagesSelected }: PageSelectorProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const togglePage = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    if (numPages) {
      const allPages = new Set(Array.from({ length: numPages }, (_, i) => i + 1));
      setSelectedPages(allPages);
    }
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleContinue = () => {
    const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);
    onPagesSelected(pagesArray);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Pages to Enhance</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose which pages you want to enhance
          </p>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="text-sm text-muted-foreground">
            {selectedPages.size} of {numPages || 0} pages selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {numPages &&
                Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedPages.has(pageNum)
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => togglePage(pageNum)}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedPages.has(pageNum)}
                        onCheckedChange={() => togglePage(pageNum)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="bg-muted/30">
                      <Page
                        pageNumber={pageNum}
                        scale={0.3}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-2 text-center">
                      <span className="text-xs font-medium">Page {pageNum}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Document>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedPages.size === 0}
          >
            Enhance Selected Pages ({selectedPages.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PageSelector;
