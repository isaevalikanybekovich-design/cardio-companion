import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StepOne from "./form-steps/StepOne";
import StepTwo from "./form-steps/StepTwo";
import StepThree from "./form-steps/StepThree";
import StepFour from "./form-steps/StepFour";
import AnalysisResults from "./AnalysisResults";

interface ECGAnalysisFormProps {
  userId: string;
}

const ECGAnalysisForm = ({ userId }: ECGAnalysisFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [ecgFile, setEcgFile] = useState<File | null>(null);
  const [patientData, setPatientData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    complaints: [] as string[],
    complaintsDetails: "",
    medicalHistory: "",
    riskFactors: [] as string[],
  });
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setAnalysisComplete(true);
  };

  if (analysisComplete && analysisResult) {
    return (
      <AnalysisResults
        result={analysisResult}
        onNewAnalysis={() => {
          setAnalysisComplete(false);
          setAnalysisResult(null);
          setCurrentStep(1);
          setEcgFile(null);
          setPatientData({
            age: "",
            gender: "",
            height: "",
            weight: "",
            complaints: [],
            complaintsDetails: "",
            medicalHistory: "",
            riskFactors: [],
          });
        }}
      />
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Анализ ЭКГ</CardTitle>
        <CardDescription>
          Заполните форму для получения детального анализа
        </CardDescription>
        <div className="pt-4">
          <div className="flex justify-between mb-2 text-sm text-muted-foreground">
            <span>Шаг {currentStep} из {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent>
        {currentStep === 1 && (
          <StepOne
            ecgFile={ecgFile}
            setEcgFile={setEcgFile}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <StepTwo
            patientData={patientData}
            setPatientData={setPatientData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <StepThree
            patientData={patientData}
            setPatientData={setPatientData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 4 && (
          <StepFour
            userId={userId}
            ecgFile={ecgFile!}
            patientData={patientData}
            setPatientData={setPatientData}
            onBack={handleBack}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ECGAnalysisForm;
