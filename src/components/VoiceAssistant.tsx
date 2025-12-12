import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  userId: string;
}

const VoiceAssistant = ({ userId }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "ru-RU";

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        await getAIResponse(text);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Ошибка распознавания",
          description: "Попробуйте снова",
          variant: "destructive",
        });
      };
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    
    setPosition({
      x: Math.max(-window.innerWidth + 150, Math.min(0, newX)),
      y: Math.max(-window.innerHeight + 150, Math.min(0, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setResponse("");
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Не поддерживается",
        description: "Голосовой ввод не поддерживается вашим браузером",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getAIResponse = async (question: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { question, userId },
      });

      if (error) throw error;

      setResponse(data.answer);
      await speak(data.answer);

      // Save to database
      await supabase.from("voice_consultations").insert({
        user_id: userId,
        question,
        answer: data.answer,
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const speak = (text: string) => {
    return new Promise<void>((resolve) => {
      if ("speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to get a better Russian voice
        const voices = window.speechSynthesis.getVoices();
        const russianVoices = voices.filter((v) => v.lang.includes("ru"));
        
        // Prefer female voices as they tend to sound more natural
        const preferredVoice = russianVoices.find(
          (v) => v.name.toLowerCase().includes("milena") ||
                 v.name.toLowerCase().includes("irina") ||
                 v.name.toLowerCase().includes("alice") ||
                 v.name.toLowerCase().includes("google") ||
                 v.name.toLowerCase().includes("female")
        ) || russianVoices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div className="relative">
        {(transcript || response) && (
          <Card className="absolute bottom-14 right-0 w-72 max-h-80 overflow-auto mb-2 shadow-lg">
            <CardContent className="p-3 space-y-2">
              {transcript && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Вы спросили:
                  </p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
              {response && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Ответ:
                  </p>
                  <p className="text-sm">{response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center gap-1">
          {/* Drag handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded-full bg-muted/50 hover:bg-muted"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {isSpeaking && (
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-md"
              onClick={stopSpeaking}
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            className={`h-10 w-10 rounded-full shadow-md transition-all ${
              isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse-slow" : ""
            }`}
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
