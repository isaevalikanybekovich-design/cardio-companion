import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Calendar, ChevronRight, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ECGHistoryProps {
  userId: string;
}

interface ECGScan {
  id: string;
  file_name: string;
  analysis_status: string;
  created_at: string;
  final_analysis: any;
  gemini_result: any;
}

const ECGHistory = ({ userId }: ECGHistoryProps) => {
  const [scans, setScans] = useState<ECGScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ECGScan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchScans();
  }, [userId]);

  const fetchScans = async () => {
    try {
      const { data, error } = await supabase
        .from("ecg_scans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScans(data || []);
    } catch (error) {
      console.error("Error fetching ECG scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Завершён
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            В процессе
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ошибка
          </Badge>
        );
    }
  };

  const openScanDetails = (scan: ECGScan) => {
    setSelectedScan(scan);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-3">
          {scans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">История ЭКГ пуста</p>
              <p className="text-sm text-muted-foreground">
                Проведите первый анализ ЭКГ
              </p>
            </div>
          ) : (
            scans.map((scan) => (
              <Card
                key={scan.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openScanDetails(scan)}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {scan.file_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(scan.created_at), "d MMMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(scan.analysis_status || "pending")}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedScan?.file_name}
            </DialogTitle>
          </DialogHeader>

          {selectedScan && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedScan.created_at), "d MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </span>
                {getStatusBadge(selectedScan.analysis_status || "pending")}
              </div>

              {selectedScan.gemini_result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Результаты анализа</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedScan.gemini_result.heart_rate && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">ЧСС</p>
                          <p className="text-lg font-semibold">
                            {selectedScan.gemini_result.heart_rate} уд/мин
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Ритм</p>
                          <p className="text-lg font-semibold">
                            {selectedScan.gemini_result.rhythm || "—"}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedScan.gemini_result.main_findings && (
                      <div>
                        <h4 className="font-medium mb-2">Основные находки</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedScan.gemini_result.main_findings}
                        </p>
                      </div>
                    )}

                    {selectedScan.gemini_result.diagnosis && (
                      <div>
                        <h4 className="font-medium mb-2">Диагноз</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedScan.gemini_result.diagnosis}
                        </p>
                      </div>
                    )}

                    {selectedScan.gemini_result.urgency && (
                      <div>
                        <h4 className="font-medium mb-2">Срочность</h4>
                        <Badge
                          variant={
                            selectedScan.gemini_result.urgency === "high"
                              ? "destructive"
                              : selectedScan.gemini_result.urgency === "medium"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {selectedScan.gemini_result.urgency === "high"
                            ? "Высокая"
                            : selectedScan.gemini_result.urgency === "medium"
                            ? "Средняя"
                            : "Низкая"}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedScan.final_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Медицинское заключение</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-sm">
                        {typeof selectedScan.final_analysis === "string"
                          ? selectedScan.final_analysis
                          : selectedScan.final_analysis.report ||
                            JSON.stringify(selectedScan.final_analysis, null, 2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ECGHistory;
