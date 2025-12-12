import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Database, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ECGHistory from "./sidebar/ECGHistory";
import ReferenceData from "./sidebar/ReferenceData";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const AppSidebar = ({ open, onOpenChange, userId }: AppSidebarProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <History className="h-4 w-4 mr-2" />
              История ЭКГ
            </TabsTrigger>
            <TabsTrigger
              value="reference"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Database className="h-4 w-4 mr-2" />
              Эталонные данные
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <User className="h-4 w-4 mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
            <ECGHistory userId={userId} />
          </TabsContent>

          <TabsContent value="reference" className="flex-1 m-0 overflow-hidden">
            <ReferenceData userId={userId} />
          </TabsContent>

          <TabsContent value="profile" className="flex-1 m-0 p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Настройки
                </h3>
                <p className="text-sm text-muted-foreground">
                  Управление настройками аккаунта
                </p>
              </div>

              <div className="pt-6 border-t">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти из аккаунта
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
