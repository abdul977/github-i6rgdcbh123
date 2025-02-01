import { Note, ProcessingVariant } from '../types/note';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

export interface ReasoningResult {
  originalNote: Note;
  processedContent: string;
  insights: string[];
  summary: string;
  variant: ProcessingVariant;
}

const VARIANT_PROMPTS = {
  [ProcessingVariant.ACTIONABLE]: (content: string) => `
    Convert the following text into a clear, structured list of actionable steps. 
    Ensure each step is specific, measurable, and practical.
    
    Text: ${content}
    
    Actionable Steps:
  `,
  [ProcessingVariant.SUMMARY]: (content: string) => `
    Provide a concise and comprehensive summary of the following text. 
    Highlight the key points, main ideas, and essential information.
    
    Text: ${content}
    
    Summary:
  `,
  [ProcessingVariant.REASONING]: (content: string) => `
    Perform a deep analytical breakdown of the text. 
    Provide insights, underlying patterns, potential implications, and critical analysis.
    
    Text: ${content}
    
    Analytical Insights:
  `,
  [ProcessingVariant.GRAMMAR]: (content: string) => `
    Review and improve the grammar, clarity, and overall writing quality of the following text. 
    Provide a corrected version with explanations of the changes.
    
    Original Text: ${content}
    
    Improved Text:
  `
};

const formatContent = (variant: ProcessingVariant, content: string): string => {
  const cleanContent = content.replace(/[*#_`]/g, '').trim();
  
  switch (variant) {
    case ProcessingVariant.ACTIONABLE:
      return cleanContent.split('\n')
        .filter(line => line.trim())
        .map((line, index) => `${index + 1}. ${line.trim()}`)
        .join('\n');
    
    case ProcessingVariant.SUMMARY:
      return cleanContent.split('\n')
        .filter(line => line.trim())
        .map(line => `• ${line.trim()}`)
        .join('\n');
    
    case ProcessingVariant.REASONING:
      return cleanContent.split('\n')
        .filter(line => line.trim())
        .map((line, index) => `Insight ${index + 1}: ${line.trim()}`)
        .join('\n\n');
    
    case ProcessingVariant.GRAMMAR:
      return `Improved Text:\n\n${cleanContent}`;
    
    default:
      return cleanContent;
  }
};

export class AIReasoningService {
  static async processNote(note: Note, variant: ProcessingVariant): Promise<ReasoningResult> {
    // Combine all entries' content
    const combinedContent = note.entries
      .map(entry => 
        `${entry.content}${entry.audio_url ? `\n[Audio Source: ${entry.audio_url}]` : ''}`
      )
      .join('\n\n');

    try {
      const chatCompletion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant specialized in processing text with various analytical techniques. Provide clear, concise output."
          },
          {
            role: "user",
            content: VARIANT_PROMPTS[variant](combinedContent)
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const rawProcessedContent = chatCompletion.choices[0]?.message?.content || 'No content generated';
      const processedContent = formatContent(variant, rawProcessedContent);

      // Generate insights and summary using another API call
      const insightsCompletion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "Extract key insights and generate a summary from the given text. Use clear, concise language."
          },
          {
            role: "user",
            content: `Generate 3-5 key insights and a brief summary from this text:\n\n${combinedContent}`
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      });

      const rawInsights = insightsCompletion.choices[0]?.message?.content 
        ? insightsCompletion.choices[0].message.content.split('\n').filter(insight => insight.trim())
        : ['No insights generated'];

      const insights = rawInsights
        .map(insight => insight.replace(/[*#_`]/g, '').trim())
        .filter(insight => insight)
        .map((insight, index) => `${index + 1}. ${insight}`);

      const summary = insights.slice(0, 2).join('\n');

      return {
        originalNote: note,
        processedContent,
        insights,
        summary,
        variant
      };
    } catch (error) {
      console.error('AI Processing Error:', error);
      return {
        originalNote: note,
        processedContent: 'Unable to generate processed content',
        insights: ['Unable to generate insights'],
        summary: 'Processing failed',
        variant
      };
    }
  }
}