import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StepOneProps {
  ecgFile: File | null;
  setEcgFile: (file: File | null) => void;
  onNext: () => void;
}

const StepOne = ({ ecgFile, setEcgFile, onNext }: StepOneProps) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Неверный формат файла",
          description: "Поддерживаются только PDF, PNG, JPG, JPEG, WEBP",
          variant: "destructive",
        });
        return;
      }
      setEcgFile(file);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="ecg-file" className="text-base">
          Загрузите файл ЭКГ
        </Label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Поддерживаемые форматы: PDF, PNG, JPG, JPEG, WEBP
        </p>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            id="ecg-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="ecg-file" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Нажмите для загрузки файла
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  или перетащите файл сюда
                </p>
              </div>
            </div>
          </label>
        </div>
        {ecgFile && (
          <div className="mt-4 p-4 bg-accent/50 rounded-lg">
            <p className="text-sm font-medium">Выбран файл:</p>
            <p className="text-sm text-muted-foreground">{ecgFile.name}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext}>Далее</Button>
      </div>
    </div>
  );
};

export default StepOne;
