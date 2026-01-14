import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotionMethodologyService {
  private readonly notionApiUrl =
    process.env.NOTION_API_URL || 'https://api.notion.com/v1';
  private readonly notionSecret = process.env.NOTION_SECRET;
  private readonly methodologyPageId = '2e87d19cc825805c9e38c9bb29ed61e4';

  private cachedMethodology: string | null = null;

  async getMethodology(): Promise<string> {
    // Return cached version if available
    if (this.cachedMethodology) {
      return this.cachedMethodology;
    }

    // Fetch from Notion
    try {
      console.log('Fetching action plan methodology from Notion...');

      const { data } = await axios.get(
        `${this.notionApiUrl}/blocks/${this.methodologyPageId}/children?page_size=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.notionSecret}`,
            'Notion-Version': '2022-06-28',
          },
        },
      );

      if (!data.results || data.results.length === 0) {
        console.warn('No content found in methodology page');
        return '';
      }

      // Convert blocks to text
      const text = this.blocksToText(data.results);
      this.cachedMethodology = text;

      console.log(`✅ Fetched methodology (${text.length} characters)`);
      return text;
    } catch (error) {
      console.error('Error fetching methodology from Notion:', error);
      return ''; // Return empty string on error
    }
  }

  private blocksToText(blocks: any[]): string {
    const lines: string[] = [];

    for (const block of blocks) {
      const type = block.type;

      switch (type) {
        case 'heading_1':
          lines.push(`# ${this.richTextToPlainText(block.heading_1.rich_text)}`);
          break;
        case 'heading_2':
          lines.push(`## ${this.richTextToPlainText(block.heading_2.rich_text)}`);
          break;
        case 'heading_3':
          lines.push(`### ${this.richTextToPlainText(block.heading_3.rich_text)}`);
          break;
        case 'paragraph':
          lines.push(this.richTextToPlainText(block.paragraph.rich_text));
          break;
        case 'bulleted_list_item':
          lines.push(`- ${this.richTextToPlainText(block.bulleted_list_item.rich_text)}`);
          break;
        case 'numbered_list_item':
          lines.push(`1. ${this.richTextToPlainText(block.numbered_list_item.rich_text)}`);
          break;
        case 'code':
          lines.push(`\`\`\`\n${this.richTextToPlainText(block.code.rich_text)}\n\`\`\``);
          break;
        case 'quote':
          lines.push(`> ${this.richTextToPlainText(block.quote.rich_text)}`);
          break;
        case 'divider':
          lines.push('---');
          break;
        default:
          // Skip unsupported block types
          break;
      }
    }

    return lines.join('\n');
  }

  private richTextToPlainText(richText: any[]): string {
    if (!richText || richText.length === 0) return '';
    return richText.map((text) => text.plain_text || '').join('');
  }
}
