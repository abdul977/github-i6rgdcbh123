import { useState } from "react";
import { Button } from "./ui/button";
import Groq from "groq-sdk";
import { useToast } from "./ui/use-toast";
import { ProcessingVariant, Note, NoteEntry } from "../types/note";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AIReasoningService } from "../services/ai-reasoning";

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

export function TranscriptionButton({
  audioUrl,
  onTranscriptionComplete
}: {
  audioUrl: string;
  onTranscriptionComplete: (transcription: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [processedContent, setProcessedContent] = useState("");
  const [processingVariant, setProcessingVariant] = useState<ProcessingVariant>(ProcessingVariant.SUMMARY);
  const { toast } = useToast();

  const handleTranscribe = async () => {
    setIsLoading(true);
    try {
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      
      const response = await groq.audio.transcriptions.create({
        file: new File([audioBlob], "recording.mp3"),
        model: "whisper-large-v3-turbo"
      });
      
      // Create a temporary note for processing
      const tempNote: Note = {
        title: "Transcription",
        processingType: processingVariant,
        entries: [{
          content: response.text,
          audio_url: audioUrl
        }]
      };

      // Process the transcription
      const processedResult = await AIReasoningService.processNote(tempNote, processingVariant);
      
      const transcriptionText = response.text;
      setTranscription(transcriptionText);
      setProcessedContent(processedResult.processedContent);
      onTranscriptionComplete(transcriptionText);
    } catch (error) {
      toast({
        title: "Transcription Error",
        description: error instanceof Error ? error.message : "Failed to transcribe audio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div>
        <Label className="block mb-1">Processing Variant</Label>
        <Select 
          value={processingVariant} 
          onValueChange={(value: ProcessingVariant) => setProcessingVariant(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Processing Variant" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ProcessingVariant).map((variant) => (
              <SelectItem key={variant} value={variant}>
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        onClick={handleTranscribe}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Transcribing..." : "Transcribe Audio"}
      </Button>
      {transcription && (
        <div className="mt-2 space-y-2">
          <div className="p-2 bg-muted rounded">
            <p className="text-sm font-bold">Original Transcription:</p>
            <p className="text-sm">{transcription}</p>
          </div>
          {processedContent && (
            <div className="p-2 bg-secondary rounded">
              <p className="text-sm font-bold">Processed Content ({processingVariant}):</p>
              <p className="text-sm">{processedContent}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}