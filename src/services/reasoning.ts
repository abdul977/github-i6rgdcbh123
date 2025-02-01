import { Note, NoteEntry } from '../types/note';

export interface ReasoningResult {
  originalNote: Note;
  processedContent: string;
  insights: string[];
  summary: string;
}

export class ReasoningService {
  // Enhanced reasoning implementation
  static async processNote(note: Note): Promise<ReasoningResult> {
    // Combine and process all entries
    const processedEntries = note.entries.map((entry, index) => 
      this.processEntry(entry, index + 1)
    );

    // Generate comprehensive processed content
    const processedContent = processedEntries.join('\n\n');

    // Generate insights based on note content
    const insights = this.generateInsights(note);

    // Create a summary
    const summary = this.generateSummary(note);

    return {
      originalNote: note,
      processedContent,
      insights,
      summary
    };
  }

  // Process individual note entries
  private static processEntry(entry: NoteEntry, entryNumber: number): string {
    let processedEntry = `Entry ${entryNumber}:\n`;
    
    if (entry.content) {
      processedEntry += `Text: ${entry.content}\n`;
    }
    
    if (entry.audio_url) {
      processedEntry += `Audio Source: ${entry.audio_url}\n`;
    }

    return processedEntry;
  }

  // Generate comprehensive insights
  private static generateInsights(note: Note): string[] {
    const insights: string[] = [];

    // Count entries and analyze content
    const totalEntries = note.entries.length;
    const entriesWithText = note.entries.filter(entry => entry.content.trim().length > 0).length;
    const entriesWithAudio = note.entries.filter(entry => entry.audio_url).length;

    // Basic note composition insights
    insights.push(`Total Entries: ${totalEntries}`);
    insights.push(`Entries with Text: ${entriesWithText}`);
    insights.push(`Entries with Audio: ${entriesWithAudio}`);

    // Content analysis
    const totalWordCount = note.entries.reduce((sum, entry) => 
      sum + (entry.content ? entry.content.trim().split(/\s+/).length : 0), 0
    );
    insights.push(`Total Word Count: ${totalWordCount}`);

    // Complexity and depth insights
    if (totalWordCount > 100) {
      insights.push('Note contains detailed and comprehensive information');
    }

    // Keyword detection (basic implementation)
    const keywords = this.detectKeywords(note);
    if (keywords.length > 0) {
      insights.push(`Key Topics: ${keywords.join(', ')}`);
    }

    return insights;
  }

  // Basic keyword detection
  private static detectKeywords(note: Note): string[] {
    const keywordMap: {[key: string]: number} = {};
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but']);

    note.entries.forEach(entry => {
      if (entry.content) {
        const words = entry.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          // Filter out common words and very short words
          if (!commonWords.has(word) && word.length > 3) {
            keywordMap[word] = (keywordMap[word] || 0) + 1;
          }
        });
      }
    });

    // Sort keywords by frequency and take top 3
    return Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  // Generate a summary of the note
  private static generateSummary(note: Note): string {
    // If no entries, return a default message
    if (note.entries.length === 0) {
      return 'No content available for summarization.';
    }

    // Combine first few words from each entry
    const summaryParts = note.entries
      .slice(0, 3)  // Take first 3 entries
      .map(entry => entry.content 
        ? entry.content.split(/\s+/).slice(0, 10).join(' ') 
        : ''
      )
      .filter(part => part.length > 0);

    // Create a concise summary
    return summaryParts.length > 0
      ? `Summary: ${summaryParts.join(' ... ')}`
      : 'Note contains entries without text content.';
  }
}