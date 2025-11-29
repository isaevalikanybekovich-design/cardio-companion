import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface StepTwoProps {
  patientData: any;
  setPatientData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepTwo = ({ patientData, setPatientData, onNext, onBack }: StepTwoProps) => {
  const { toast } = useToast();

  const handleNext = () => {
    if (!patientData.age || !patientData.gender || !patientData.height || !patientData.weight) {
      toast({
        title: "Заполните все поля",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Возраст *</Label>
          <Input
            id="age"
            type="number"
            placeholder="35"
            value={patientData.age}
            onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
            min="1"
            max="120"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Пол *</Label>
          <Select
            value={patientData.gender}
            onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите пол" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Мужской</SelectItem>
              <SelectItem value="female">Женский</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Рост (см) *</Label>
          <Input
            id="height"
            type="number"
            placeholder="175"
            value={patientData.height}
            onChange={(e) => setPatientData({ ...patientData, height: e.target.value })}
            min="50"
            max="250"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Вес (кг) *</Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            value={patientData.weight}
            onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
            min="20"
            max="300"
          />
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Назад
        </Button>
        <Button onClick={handleNext}>Далее</Button>
      </div>
    </div>
  );
};

export default StepTwo;
