import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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
  const recognitionRef = useRef<any>(null);
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
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = 0.9;
        
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

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        {(transcript || response) && (
          <Card className="absolute bottom-20 right-0 w-80 max-h-96 overflow-auto mb-4">
            <CardContent className="p-4 space-y-3">
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
        
        <div className="flex gap-2">
          {isSpeaking && (
            <Button
              size="lg"
              variant="secondary"
              className="h-16 w-16 rounded-full shadow-lg"
              onClick={stopSpeaking}
            >
              <VolumeX className="h-6 w-6" />
            </Button>
          )}
          
          <Button
            size="lg"
            className={`h-16 w-16 rounded-full shadow-lg transition-all ${
              isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse-slow" : ""
            }`}
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
