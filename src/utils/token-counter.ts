export class TokenCounter {
  private static readonly CHARS_PER_TOKEN = 4; // Rough estimate for English text
  private static readonly CODE_CHARS_PER_TOKEN = 3; // Code is typically more dense
  
  static countTokens(text: string, isCode = false): number {
    const charsPerToken = isCode ? this.CODE_CHARS_PER_TOKEN : this.CHARS_PER_TOKEN;
    return Math.ceil(text.length / charsPerToken);
  }
  
  static countMarkdownTokens(markdown: string): number {
    // Remove markdown syntax for more accurate token counting
    const cleaned = markdown
      .replace(/^#{1,6}\s+/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, (match) => {
        // Count code blocks separately
        const codeContent = match.replace(/```\w*\n?/, '').replace(/```$/, '');
        return ' '.repeat(this.countTokens(codeContent, true) * this.CHARS_PER_TOKEN);
      })
      .replace(/^\s*[-*+]\s+/gm, '') // List items
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
    
    return this.countTokens(cleaned);
  }
  
  static truncateToTokenLimit(text: string, maxTokens: number, isCode = false): string {
    const estimatedTokens = this.countTokens(text, isCode);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    const charsPerToken = isCode ? this.CODE_CHARS_PER_TOKEN : this.CHARS_PER_TOKEN;
    const maxChars = maxTokens * charsPerToken;
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Try to truncate at sentence or line boundaries
    const truncated = text.substring(0, maxChars);
    const lastSentence = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    if (lastSentence > maxChars * 0.8) {
      return `${truncated.substring(0, lastSentence + 1)  }...`;
    } else if (lastNewline > maxChars * 0.8) {
      return `${truncated.substring(0, lastNewline)  }\n...`;
    } else {
      const lastSpace = truncated.lastIndexOf(' ');
      return `${truncated.substring(0, lastSpace > maxChars * 0.8 ? lastSpace : maxChars)  }...`;
    }
  }
  
  static optimizeContent(content: string, maxTokens: number): string {
    // Remove excessive whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/[ \t]+/g, ' ');
    content = content.trim();
    
    // If still too long, truncate intelligently
    return this.truncateToTokenLimit(content, maxTokens);
  }
}