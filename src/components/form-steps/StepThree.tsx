import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepThreeProps {
  patientData: any;
  setPatientData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const complaints = [
  "Боль в груди",
  "Одышка",
  "Учащённое сердцебиение",
  "Головокружение",
  "Обмороки",
  "Отёки",
  "Слабость",
  "Другое",
];

const StepThree = ({ patientData, setPatientData, onNext, onBack }: StepThreeProps) => {
  const toggleComplaint = (complaint: string) => {
    const current = patientData.complaints || [];
    if (current.includes(complaint)) {
      setPatientData({
        ...patientData,
        complaints: current.filter((c: string) => c !== complaint),
      });
    } else {
      setPatientData({
        ...patientData,
        complaints: [...current, complaint],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Текущие жалобы</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {complaints.map((complaint) => (
            <div key={complaint} className="flex items-center space-x-2">
              <Checkbox
                id={complaint}
                checked={(patientData.complaints || []).includes(complaint)}
                onCheckedChange={() => toggleComplaint(complaint)}
              />
              <Label
                htmlFor={complaint}
                className="text-sm font-normal cursor-pointer"
              >
                {complaint}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="complaintsDetails">
          Подробное описание жалоб (необязательно)
        </Label>
        <Textarea
          id="complaintsDetails"
          placeholder="Опишите ваши симптомы более подробно..."
          value={patientData.complaintsDetails}
          onChange={(e) =>
            setPatientData({ ...patientData, complaintsDetails: e.target.value })
          }
          rows={4}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Назад
        </Button>
        <Button onClick={onNext}>Далее</Button>
      </div>
    </div>
  );
};

export default StepThree;
