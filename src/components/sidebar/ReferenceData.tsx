import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferenceDataProps {
  userId: string;
}

interface ReferenceItem {
  id: string;
  name: string;
  value_min: number | null;
  value_max: number | null;
  unit: string | null;
  description: string | null;
}

const defaultReferences = [
  { name: "ЧСС (пульс)", value_min: 60, value_max: 100, unit: "уд/мин", description: "Частота сердечных сокращений в покое" },
  { name: "Интервал PQ", value_min: 120, value_max: 200, unit: "мс", description: "Время от начала зубца P до начала QRS" },
  { name: "Комплекс QRS", value_min: 60, value_max: 100, unit: "мс", description: "Ширина комплекса QRS" },
  { name: "Интервал QT", value_min: 350, value_max: 450, unit: "мс", description: "Электрическая систола желудочков" },
  { name: "Интервал RR", value_min: 600, value_max: 1000, unit: "мс", description: "Расстояние между соседними R-зубцами" },
];

const ReferenceData = ({ userId }: ReferenceDataProps) => {
  const [data, setData] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ReferenceItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    value_min: "",
    value_max: "",
    unit: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const { data: refData, error } = await supabase
        .from("reference_data")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setData(refData || []);
    } catch (error) {
      console.error("Error fetching reference data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDefaultValues = async () => {
    try {
      const insertData = defaultReferences.map((ref) => ({
        user_id: userId,
        ...ref,
      }));

      const { error } = await supabase.from("reference_data").insert(insertData);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Стандартные эталонные значения добавлены",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormData({
      name: "",
      value_min: "",
      value_max: "",
      unit: "",
      description: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: ReferenceItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      value_min: item.value_min?.toString() || "",
      value_max: item.value_max?.toString() || "",
      unit: item.unit || "",
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        user_id: userId,
        name: formData.name,
        value_min: formData.value_min ? parseFloat(formData.value_min) : null,
        value_max: formData.value_max ? parseFloat(formData.value_max) : null,
        unit: formData.unit || null,
        description: formData.description || null,
      };

      if (editItem) {
        const { error } = await supabase
          .from("reference_data")
          .update(payload)
          .eq("id", editItem.id);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Данные обновлены",
        });
      } else {
        const { error } = await supabase.from("reference_data").insert([payload]);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Данные добавлены",
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("reference_data").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Данные удалены",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
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
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Эталонные значения</h3>
            <p className="text-sm text-muted-foreground">
              Медицинские нормы для сверки
            </p>
          </div>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-4 space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Нет эталонных данных</p>
              <Button variant="outline" onClick={addDefaultValues}>
                Добавить стандартные значения
              </Button>
            </div>
          ) : (
            data.map((item) => (
              <Card key={item.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {item.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">
                      {item.value_min} — {item.value_max}
                    </span>
                    {item.unit && (
                      <span className="text-muted-foreground">{item.unit}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {data.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Эти значения используются ИИ для сверки результатов анализа ЭКГ
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Редактировать" : "Добавить"} эталонное значение
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название параметра</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Например: ЧСС (пульс)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value_min">Минимум</Label>
                <Input
                  id="value_min"
                  type="number"
                  value={formData.value_min}
                  onChange={(e) =>
                    setFormData({ ...formData, value_min: e.target.value })
                  }
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value_max">Максимум</Label>
                <Input
                  id="value_max"
                  type="number"
                  value={formData.value_max}
                  onChange={(e) =>
                    setFormData({ ...formData, value_max: e.target.value })
                  }
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="уд/мин"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Частота сердечных сокращений в покое"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editItem ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferenceData;
