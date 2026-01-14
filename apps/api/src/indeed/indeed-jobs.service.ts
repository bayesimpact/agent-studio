import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import * as fs from 'fs';
import * as path from 'path';

export class SimplifiedIndeedJobOffer {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly company: string,
    public readonly location: string,
    public readonly jobType: string,
    public readonly url: string,
    public readonly salary?: string,
    public readonly description?: string,
  ) {}

  static fromIndeedJob(job: any): SimplifiedIndeedJobOffer {
    return new SimplifiedIndeedJobOffer(
      job.jobid || job.url,
      job.job_title,
      job.company_name,
      job.location || job.job_location,
      job.job_type || 'Not specified',
      job.url || job.apply_link,
      job.salary_formatted,
      job.description_text,
    );
  }

  static fromIndeedJobs(jobs: any[]): SimplifiedIndeedJobOffer[] {
    if (!jobs || jobs.length === 0) {
      return [];
    }
    return jobs.map((job) => SimplifiedIndeedJobOffer.fromIndeedJob(job));
  }
}

@Injectable()
export class IndeedJobsService implements AIServiceProvider {
  private allJobsData: any[] = [];

  constructor() {
    // Load all JSON files from the rawjson folder
    const rawJsonDir = path.join(__dirname, 'rawjson');

    try {
      const files = fs.readdirSync(rawJsonDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`Loading ${jsonFiles.length} JSON files from ${rawJsonDir}`);

      for (const file of jsonFiles) {
        const filePath = path.join(rawJsonDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jobs = JSON.parse(fileContent);

        if (Array.isArray(jobs)) {
          this.allJobsData.push(...jobs);
          console.log(`Loaded ${jobs.length} jobs from ${file}`);
        }
      }

      console.log(`Total jobs loaded: ${this.allJobsData.length}`);
    } catch (error) {
      console.error('Error loading Indeed JSON files:', error);
    }
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'indeed_jobs_search',
      description: 'Search for job offers on Indeed (US-based job search engine)',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobTitles: {
            type: Type.ARRAY,
            description: 'Job titles to search for in English, e.g. "welder" or "software engineer"',
            items: {
              type: Type.STRING,
            }
          },
          location: {
            type: Type.STRING,
            description: 'Location in the format "City, State" (e.g., "Columbus, OH")',
          },
        },
        required: ['jobTitles', 'location'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`indeed_jobs_search\`
**Description**: Search for job offers via Indeed (US job search platform).

**Parameters**:
- \`jobTitles\`: 1-3 relevant job titles in English
  - Examples: ["welder"], ["software engineer", "full stack developer"]
- \`location\`: Location in "City, State" format (required - ask if not provided)
  - Example: "Columbus, OH"

**Returns**: List of job offers with id, title, company, location, job type, salary (if available), and application URL (up to 20 results)

**Note**: Currently returns static data from local JSON files for demonstration purposes. Results are filtered by job title when provided.
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{jobOffers: SimplifiedIndeedJobOffer[]}> {
    const jobTitles = functionCall.args['jobTitles'] as string[];
    const location = functionCall.args['location'] as string;

    console.log('Indeed search with params:', { jobTitles, location });

    // Filter jobs by job title if provided
    let filteredJobs = this.allJobsData;

    if (jobTitles && jobTitles.length > 0) {
      filteredJobs = this.allJobsData.filter(job => {
        const jobTitle = (job.job_title || '').toLowerCase();
        return jobTitles.some(searchTitle =>
          jobTitle.includes(searchTitle.toLowerCase())
        );
      });
    }

    // If no matches found, return all jobs (fallback)
    if (filteredJobs.length === 0) {
      console.log('No jobs matched the search criteria, returning all jobs');
      filteredJobs = this.allJobsData;
    }

    // // Limit to 20 results
    // const limitedJobs = filteredJobs.slice(0, 20);
    const jobOffers = SimplifiedIndeedJobOffer.fromIndeedJobs(filteredJobs);

    console.log(`Indeed job offers found: ${jobOffers.length} (filtered from ${this.allJobsData.length} total jobs)`);
    return { jobOffers };
  }

  formatResultsForPrompt(result: { jobOffers: SimplifiedIndeedJobOffer[] }): string {
    const { jobOffers } = result;

    if (!jobOffers || jobOffers.length === 0) {
      return `**Indeed Job Offers**: No offers found.`;
    }

    const summary = `**Indeed Job Offers** (${jobOffers.length} results):

${jobOffers.map((job, index) => `${index + 1}. **${job.title}** - ${job.company}
   - Location: ${job.location}
   - Type: ${job.jobType}${job.salary ? `\n   - Salary: ${job.salary}` : ''}
   - URL: ${job.url}`).join('\n\n')}

**How to use these offers**:
- Include URLs in CTAs (type: "url") for job application actions
- Mention job types and salary information in action content
- Adapt actions based on locations (mobility, transportation)
- Create actions with titles like "Apply to [Company]" or "View [Job Title] position"`;

    return summary;
  }
}