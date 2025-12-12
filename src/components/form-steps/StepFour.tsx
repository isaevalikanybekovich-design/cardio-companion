import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StepFourProps {
  userId: string;
  ecgFile: File;
  patientData: any;
  setPatientData: (data: any) => void;
  onBack: () => void;
  onAnalysisComplete: (result: any) => void;
}

const riskFactors = [
  "Курение",
  "Гипертония",
  "Диабет",
  "Высокий холестерин",
  "Семейная история сердечных заболеваний",
  "Ожирение",
  "Малоподвижный образ жизни",
  "Стресс",
];

const StepFour = ({
  userId,
  ecgFile,
  patientData,
  setPatientData,
  onBack,
  onAnalysisComplete,
}: StepFourProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleRiskFactor = (factor: string) => {
    const current = patientData.riskFactors || [];
    if (current.includes(factor)) {
      setPatientData({
        ...patientData,
        riskFactors: current.filter((f: string) => f !== factor),
      });
    } else {
      setPatientData({
        ...patientData,
        riskFactors: [...current, factor],
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          user_id: userId,
          age: parseInt(patientData.age),
          gender: patientData.gender,
          height_cm: parseInt(patientData.height),
          weight_kg: parseInt(patientData.weight),
          current_complaints: patientData.complaints,
          complaints_details: patientData.complaintsDetails,
          medical_history: patientData.medicalHistory,
          risk_factors: patientData.riskFactors,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Upload ECG file
      const fileExt = ecgFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("ecg-files")
        .upload(fileName, ecgFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ecg-files")
        .getPublicUrl(fileName);

      // Create ECG scan record
      const { data: ecgScan, error: scanError } = await supabase
        .from("ecg_scans")
        .insert({
          user_id: userId,
          patient_id: patient.id,
          file_name: ecgFile.name,
          file_type: ecgFile.type,
          file_url: publicUrl,
          analysis_status: "pending",
        })
        .select()
        .single();

      if (scanError) throw scanError;

      // Call analysis edge function
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        "analyze-ecg",
        {
          body: {
            ecgScanId: ecgScan.id,
            fileUrl: publicUrl,
            fileType: ecgFile.type,
          },
        }
      );

      if (analysisError) throw analysisError;

      // Generate report
      const { data: reportResult, error: reportError } = await supabase.functions.invoke(
        "generate-report",
        {
          body: {
            ecgScanId: ecgScan.id,
            patientId: patient.id,
            userId: userId,
            ecgAnalysis: analysisResult,
            patientData: {
              age: patient.age,
              gender: patient.gender,
              complaints: patient.current_complaints,
              complaintsDetails: patient.complaints_details,
              medicalHistory: patient.medical_history,
              riskFactors: patient.risk_factors,
            },
          },
        }
      );

      if (reportError) throw reportError;

      toast({
        title: "Анализ завершён",
        description: "Результаты готовы",
      });

      onAnalysisComplete({
        ...reportResult,
        ecgAnalysis: analysisResult,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Ошибка анализа",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Факторы риска</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {riskFactors.map((factor) => (
            <div key={factor} className="flex items-center space-x-2">
              <Checkbox
                id={factor}
                checked={(patientData.riskFactors || []).includes(factor)}
                onCheckedChange={() => toggleRiskFactor(factor)}
              />
              <Label
                htmlFor={factor}
                className="text-sm font-normal cursor-pointer"
              >
                {factor}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="medicalHistory">
          Медицинская история (необязательно)
        </Label>
        <Textarea
          id="medicalHistory"
          placeholder="Опишите предыдущие заболевания, операции, принимаемые лекарства..."
          value={patientData.medicalHistory}
          onChange={(e) =>
            setPatientData({ ...patientData, medicalHistory: e.target.value })
          }
          rows={4}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Назад
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Анализ..." : "Начать анализ"}
        </Button>
      </div>
    </div>
  );
};

export default StepFour;
