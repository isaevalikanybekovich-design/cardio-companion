import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, MoreVertical } from "lucide-react";
import ECGAnalysisForm from "@/components/ECGAnalysisForm";
import VoiceAssistant from "@/components/VoiceAssistant";
import AppSidebar from "@/components/AppSidebar";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Если ошибка refresh token - очищаем сессию и перенаправляем на логин
      if (error && error.message?.includes("Refresh Token")) {
        supabase.auth.signOut();
        navigate("/login");
        setLoading(false);
        return;
      }
      
      if (session) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Обработка ошибки токена
      if (event === 'TOKEN_REFRESHED' && !session) {
        supabase.auth.signOut();
        navigate("/login");
        return;
      }
      
      if (session) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow">
          <Heart className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-base sm:text-lg font-bold truncate">КардиоАссистент</h1>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ECGAnalysisForm userId={user?.id} />
      </main>

      <VoiceAssistant userId={user?.id} />
      
      <AppSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        userId={user?.id}
      />
    </div>
  );
};

export default Index;
