import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, RefreshCw, Activity } from "lucide-react";

interface AnalysisResultsProps {
  result: any;
  onNewAnalysis: () => void;
}

const AnalysisResults = ({ result, onNewAnalysis }: AnalysisResultsProps) => {
  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "норма":
        return "bg-success text-success-foreground";
      case "требует внимания":
        return "bg-warning text-warning-foreground";
      case "срочная помощь":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Результаты анализа ЭКГ
            </CardTitle>
            <Badge className={getRiskLevelColor(result.riskLevel)}>
              {result.riskLevel || "Неизвестно"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.ecgAnalysis && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Данные ЭКГ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.ecgAnalysis.heart_rate && (
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">ЧСС</p>
                    <p className="text-xl font-semibold">
                      {result.ecgAnalysis.heart_rate}
                    </p>
                  </div>
                )}
                {result.ecgAnalysis.rhythm && (
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ритм</p>
                    <p className="text-xl font-semibold">
                      {result.ecgAnalysis.rhythm}
                    </p>
                  </div>
                )}
              </div>
              {result.ecgAnalysis.main_findings && (
                <div>
                  <p className="font-medium mb-2">Основные находки:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.ecgAnalysis.main_findings.map((finding: string, i: number) => (
                      <li key={i} className="text-sm">
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.ecgAnalysis.diagnosis && (
                <div>
                  <p className="font-medium mb-2">Диагноз:</p>
                  <p className="text-sm">{result.ecgAnalysis.diagnosis}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Заключение врача</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{result.reportText}</p>
            </div>
          </div>

          {result.recommendations && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Рекомендации</h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{result.recommendations}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <Button className="flex-1">
              <FileDown className="mr-2 h-4 w-4" />
              Скачать отчёт в PDF
            </Button>
            <Button variant="outline" onClick={onNewAnalysis}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Новый анализ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;
