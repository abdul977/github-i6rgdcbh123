import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Wand2, Loader2 } from 'lucide-react';
import { Note, NoteEntry, ProcessingVariant } from '../types/note';
import { AIReasoningService } from '../services/ai-reasoning';
import { useToast } from '../hooks/use-toast';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

interface ProcessingButtonProps {
  note: Note;
  disabled?: boolean;
}

const ProcessingButton: React.FC<ProcessingButtonProps> = ({ note, disabled = false }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingVariant, setProcessingVariant] = useState<ProcessingVariant>(ProcessingVariant.SUMMARY);

  const transcribeAudioEntry = async (audioUrl: string): Promise<string> => {
    try {
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      
      const response = await groq.audio.transcriptions.create({
        file: new File([audioBlob], "recording.mp3"),
        model: "whisper-large-v3-turbo"
      });
      
      return response.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      return '';
    }
  };

  const handleProcessNote = async () => {
    setIsProcessing(true);
    try {
      // Transcribe audio entries
      const transcribedEntries = await Promise.all(
        note.entries.map(async (entry) => {
          const transcribedContent = entry.audio_url 
            ? await transcribeAudioEntry(entry.audio_url) 
            : '';
          
          return {
            ...entry,
            content: entry.content + (transcribedContent ? `\n\n[Transcribed Audio: ${transcribedContent}]` : '')
          };
        })
      );

      // Create a new note with transcribed entries
      const processedNote: Note = {
        ...note,
        processingType: processingVariant,
        entries: transcribedEntries
      };

      // Process the note using AIReasoningService
      const result = await AIReasoningService.processNote(processedNote, processingVariant);

      // Navigate to reasoning results with processed data
      navigate('/reasoning-results', { 
        state: { 
          note: processedNote,
          result: result
        } 
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = 
    disabled || 
    isProcessing || 
    (!note.title && note.entries.every(entry => !entry.content && !entry.audio_url));

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={processingVariant} 
        onValueChange={(value: ProcessingVariant) => setProcessingVariant(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Processing Variant" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(ProcessingVariant).map((variant) => (
            <SelectItem key={variant} value={variant}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={handleProcessNote} 
        disabled={isButtonDisabled}
        className="bg-purple-500 hover:bg-purple-600 text-white flex items-center"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Wand2 className="h-4 w-4 mr-2" />
        )}
        {isProcessing ? 'Processing...' : 'AI Magic'}
      </Button>
    </div>
  );
};

export default ProcessingButton;