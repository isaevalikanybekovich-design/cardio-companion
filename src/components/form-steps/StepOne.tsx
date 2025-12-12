import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Camera, Image, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StepOneProps {
  ecgFile: File | null;
  setEcgFile: (file: File | null) => void;
  onNext: () => void;
}

const StepOne = ({ ecgFile, setEcgFile, onNext }: StepOneProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
    "image/heif"
  ];

  const validateAndSetFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Проверка размера файла (макс 20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла: 20 МБ",
          variant: "destructive",
        });
        return;
      }

      // Проверка типа файла
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(file.type) || 
                          ['heic', 'heif', 'pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(fileExtension || '');
      
      if (!isValidType) {
        toast({
          title: "Неверный формат файла",
          description: "Поддерживаются: PDF, PNG, JPG, JPEG, WEBP, HEIC",
          variant: "destructive",
        });
        return;
      }

      // Для HEIC/HEIF - показываем предупреждение что нужно конвертировать
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          fileExtension === 'heic' || fileExtension === 'heif') {
        toast({
          title: "Формат HEIC",
          description: "Рекомендуется конвертировать в JPG для лучшей совместимости. Попробуем обработать как есть.",
        });
      }

      // Для изображений - проверяем что файл читается
      if (file.type.startsWith('image/') || 
          ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'].includes(fileExtension || '')) {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve();
          reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
          reader.readAsDataURL(file);
        });
      }

      setEcgFile(file);
      toast({
        title: "Файл загружен",
        description: file.name,
      });
    } catch (error) {
      console.error("File validation error:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось обработать файл. Попробуйте другой формат.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
    // Сброс значения input для повторной загрузки того же файла
    e.target.value = '';
  };

  const handleNext = () => {
    if (!ecgFile) {
      toast({
        title: "Загрузите файл",
        description: "Пожалуйста, загрузите файл ЭКГ",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  const clearFile = () => {
    setEcgFile(null);
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const getFileIcon = () => {
    if (!ecgFile) return null;
    if (ecgFile.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-primary" />;
    }
    return <Image className="h-8 w-8 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base">
          Загрузите файл ЭКГ
        </Label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Поддерживаемые форматы: PDF, PNG, JPG, JPEG, WEBP
        </p>

        {/* Скрытые input элементы */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!ecgFile ? (
          <div className="space-y-4">
            {/* Основная область загрузки */}
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={openGallery}
            >
              <div className="flex flex-col items-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <p className="text-sm font-medium">Обработка файла...</p>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Нажмите для выбора файла
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        или перетащите файл сюда
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Кнопки для мобильных устройств */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={openGallery}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Из галереи
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={openCamera}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Сделать фото
              </Button>
            </div>
          </div>
        ) : (
          /* Отображение выбранного файла */
          <div className="border rounded-lg p-4 bg-accent/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {getFileIcon()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{ecgFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(ecgFile.size)} • {ecgFile.type || 'Неизвестный тип'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Превью для изображений */}
            {ecgFile.type.startsWith('image/') && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(ecgFile)}
                  alt="Превью ЭКГ"
                  className="w-full max-h-48 object-contain rounded-md bg-muted"
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
              </div>
            )}

            {/* Кнопка для замены файла */}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openGallery}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Заменить
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCamera}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Новое фото
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!ecgFile || isProcessing}>
          Далее
        </Button>
      </div>
    </div>
  );
};

export default StepOne;
