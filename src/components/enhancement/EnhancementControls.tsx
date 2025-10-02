import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import { EnhancementSettings } from '@/lib/enhancement/canvasFilters';

interface EnhancementControlsProps {
  settings: EnhancementSettings;
  onSettingsChange: (settings: EnhancementSettings) => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveProgress?: number;
}

const EnhancementControls = ({
  settings,
  onSettingsChange,
  onReset,
  onSave,
  isSaving,
  saveProgress
}: EnhancementControlsProps) => {
  const updateSetting = (key: keyof EnhancementSettings, value: number[]) => {
    onSettingsChange({
      ...settings,
      [key]: value[0]
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Enhancement Controls</h3>
      </div>

      {/* Brightness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="brightness" className="text-sm font-medium">
            Brightness
          </Label>
          <span className="text-sm text-muted-foreground">{settings.brightness}</span>
        </div>
        <Slider
          id="brightness"
          min={-100}
          max={100}
          step={1}
          value={[settings.brightness]}
          onValueChange={(value) => updateSetting('brightness', value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="contrast" className="text-sm font-medium">
            Contrast
          </Label>
          <span className="text-sm text-muted-foreground">{settings.contrast}</span>
        </div>
        <Slider
          id="contrast"
          min={-100}
          max={100}
          step={1}
          value={[settings.contrast]}
          onValueChange={(value) => updateSetting('contrast', value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>

      {/* Sharpness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sharpness" className="text-sm font-medium">
            Sharpness
          </Label>
          <span className="text-sm text-muted-foreground">{settings.sharpness}</span>
        </div>
        <Slider
          id="sharpness"
          min={0}
          max={100}
          step={1}
          value={[settings.sharpness]}
          onValueChange={(value) => updateSetting('sharpness', value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="threshold" className="text-sm font-medium">
            Black/White Threshold
          </Label>
          <span className="text-sm text-muted-foreground">
            {settings.threshold === 0 ? 'Off' : settings.threshold}
          </span>
        </div>
        <Slider
          id="threshold"
          min={0}
          max={255}
          step={1}
          value={[settings.threshold]}
          onValueChange={(value) => updateSetting('threshold', value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Off</span>
          <span>128</span>
          <span>255</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={onReset}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Original
        </Button>
        <Button
          className="w-full"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
              {saveProgress !== undefined ? `Saving... ${saveProgress}%` : 'Saving...'}
            </>
          ) : (
            'Apply & Save'
          )}
        </Button>
      </div>
    </Card>
  );
};

export default EnhancementControls;
