import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '@app/config';
import { APIService } from './api.service';
import {
  CreateDatabaseDTO,
  DocumentContentDTO,
  RemoveDatabaseDocumentDTO,
} from './dto/database1';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from '@app/schema';

const maxTokensLLM = 110000;

@Injectable()
export class DatabaseService {
  constructor(
    private configService: AppConfigService,
    private apiService: APIService,
    @InjectRepository(Database)
    private readonly databaseRepository: Repository<Database>,
  ) {}

  async get(): Promise<any> {
    const result = await this.databaseRepository.find();
    return { data: result };
  }

  async up(): Promise<any> {
    try {
      const config = this.configService.getMarqoUrl();
      const localLLMURL = `${config.localLLMURL}/v1/internal/model/info`;
      const response = await axios.get(localLLMURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 200000,
      });
      if (!response.data.loader) {
        return {
          up: false,
        };
      }

      const marqoURL = `${config.marqoUrl}`;
      const marqoResponse = await axios.get(marqoURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 200000,
      });
      if (!marqoResponse.data.message) {
        return {
          up: false,
        };
      }
      return {
        up: true,
      };
    } catch (error) {
      console.log('🚀 ~ DatabaseService ~ up ~ error:', error);
      return {
        up: false,
      };
    }
  }

  async create(data: CreateDatabaseDTO): Promise<any> {
    const url = `indexes/${data.name}`;
    const jsonData = {
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      type: 'unstructured',
    };

    try {
      console.log('Sending data to API:', url, jsonData);
      const response = await this.apiService.post(url, jsonData);
      console.log('API response:', response);

      const newDatabase = this.databaseRepository.create({
        name: data.name,
        documents: [],
      });

      return await this.databaseRepository.save(newDatabase);
    } catch (error) {
      console.error('Full error details:', error);

      if (error.response) {
        console.error('API error response:', error.response);
      }
      throw new Error(
        'Failed to create database: ' + (error.message || 'Unknown error'),
      );
    }
  }

  private async indexAPI(indexName: string): Promise<string> {
    const url = `indexes`;
    try {
      const response = await this.apiService.get(url);
      return response.results.find((x) => x.indexName === indexName)
        ?.marqoEndpoint;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `ERROR: ${error.response ? error.response.data : error.message}`,
      );
    }
  }

  async update(id: string, body: DocumentContentDTO): Promise<Database> {
    const database = await this.databaseRepository.findOne({ where: { id } });
    if (!database) {
      throw new InternalServerErrorException('Database not found');
    }

    const config = this.configService.getMarqoUrl();
    const marqoUrl = config.marqoUrl;
    const url = `${marqoUrl}/indexes/${database.name}/documents`;

    try {
      for (let i = 0; i < body.textContents.length; i += 4) {
        const requestData = {
          documents: body.textContents.slice(i, i + 4),
          tensorFields: ['filename', 'text'],
        };
        await this.apiService.extenralAPICall(url, 'POST', requestData);
      }
      const database1 = await this.databaseRepository.findOne({
        where: { id },
      });

      database1.documents.push({
        fileName: body.textContents[0].filename,
        url: body.url,
      });
      return await this.databaseRepository.save(database1);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteDocument(data: RemoveDatabaseDocumentDTO): Promise<void> {
    const database = await this.databaseRepository.findOne({
      where: { id: data.id },
    });
    if (!database) {
      throw new InternalServerErrorException('Database not found');
    }
    database.documents = database.documents.filter(
      (doc) => doc.url !== data.url,
    );

    try {
      await this.databaseRepository.save(database);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private async search(indexName: string, query: string): Promise<any> {
    const config = this.configService.getMarqoUrl();

    const marqoUrl = config.marqoUrl;
    const url = `${marqoUrl}/indexes/${indexName}/search`;
    const editedquery = this.quoteMCodesAndNumbers(query);
    const requestData = {
      q: editedquery,
      limit: 10,
      searchMethod: 'HYBRID',
    };

    try {
      const response = await this.apiService.post(url, requestData);
      return response;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.data);
    }
  }

  private quoteMCodesAndNumbers(input: string | undefined | null): string {
    if (!input) {
      return '';
    }

    input = encodeURIComponent(input);

    // Add quotes around 5 or more numbers not already quoted (helps with lexical search for things like alarm codes or specific numbers)
    input = input.replace(/(?<!\")\b\d{5,}\b(?!\")/g, '"$&"');

    // Add quotes around "m*" patterns, convert 'm' to 'M', if not already quoted
    input = input.replace(/(?<!\")\b[Mm](\d*)\b(?!\")/g, '"M$1"');

    return input;
  }

  private estimateTokens(text) {
    return text.length;
  }

  private expandFromCallout(characters, callout, fullText) {
    let index = fullText.indexOf(callout);
    let workingText = fullText;
    let workingCallout = callout;
    if (index === -1) {
      console.log('Sanitizing text..');
      workingCallout = this.sanitizeString(callout);
      workingText = this.sanitizeString(fullText);
      index = workingText.indexOf(workingCallout);
      if (index === -1) {
        console.log('Still could not find callout even with sanitized text.');
        return callout;
      }
    }

    const startIndex = Math.max(0, index - characters);
    let length = callout.length + characters * 2;
    if (startIndex + length > fullText.length)
      length = fullText.length - startIndex;

    return fullText.substring(startIndex, startIndex + length);
  }

  private sanitizeString(input: string | undefined | null): string {
    if (!input) {
      return '';
    }
    return input.trim().replace(/\s+/g, ' ');
  }

  private createLLMQuery(formattedQuery: string, hitResults) {
    let hitResultsString = '';
    const resultsLimit = 5;
    for (let i = 0; i < Math.min(hitResults.length, resultsLimit); i++) {
      hitResultsString += `Result Highlight: ${hitResults[i].highlight}\n`;
      hitResultsString += `Result Document: ${hitResults[i].filename}\n`;
      hitResultsString += `Result Page: ${hitResults[i].pagenumber}\n\n`;
    }
    const tokenEstimate = this.estimateTokens(
      formattedQuery + hitResultsString,
    );
    const allowableAdditionalTokens = maxTokensLLM - tokenEstimate;

    if (allowableAdditionalTokens > 0) {
      const tokensPerHit = Math.floor(
        allowableAdditionalTokens / hitResults.length,
      );
      hitResultsString = '';
      for (let i = 0; i < Math.min(hitResults.length, resultsLimit); i++) {
        hitResultsString += `Result Highlight: ${this.expandFromCallout(
          tokensPerHit * 3,
          hitResults[i].highlight,
          hitResults[i].text,
        )}\n`;
        hitResultsString += `Result Document: ${hitResults[i].filename}\n`;
        hitResultsString += `Result Page: ${hitResults[i].pagenumber}\n\n`;
      }
    }

    const userQueryPart = formattedQuery;
    formattedQuery = '';
    formattedQuery += '---SEARCH RESULTS---\n';
    formattedQuery += hitResultsString + '\n\n';
    formattedQuery += userQueryPart;

    console.log('Final token count: ');
    console.log(formattedQuery);
    const tokenCount = this.estimateTokens(formattedQuery);
    console.log(tokenCount);
    return formattedQuery;
  }

  private async queryLLM(formattedQueryWithResults) {
    const marqo = this.configService.getMarqoUrl();

    const url = 'https://api.openai.com/v1/chat/completions';
    const requestData = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: "You are a Ed, Edlore's AI Assistant. ",
        },
        {
          role: 'user',
          content: formattedQueryWithResults,
        },
      ],
    };

    try {
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${marqo.openAIKey}`,
        },
        timeout: 200000,
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  async queryLocalLLM(formattedQueryWithResults) {
    const config = this.configService.getMarqoUrl();
    const url = `${config.localLLMURL}/v1/chat/completions`;
    const requestData = {
      context: `The following is a conversation with an AI Large Language Model. The AI has been trained to answer questions, provide recommendations, and help with decision making, es[ecially with regard to existing documentation. The AI follows user requests.

        You are Ed, Edlore's AI Assistant. You are helpful and assist with helping queries about various industrial equipment. You will be given a user prompt along with several search results from a document database based on technical manuals or manuals for various things in various domains. Only answer the user's question if you are sure of the answer and it exists in the search results, otherwise summarize the results from the search instead in your own words. Not all results will be pertinent to the question, and results are in order of pertinence. If the answer is not in the results, please apologize and explain that the answer was not found in the search results.`,
      temperature: 1.0,
      guidance_scale: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      repetition_penalty: 1.0,
      typical_p: 1.0,
      tfs: 1.0,
      top_a: 0.0,
      encoder_repetition_penalty: 1.0,
      preset: 'My Preset',
      character: 'EdloreAIInstruct',
      max_new_tokens: 4096,
      stream: false,
      mode: 'chat-instruct',
      messages: [
        {
          role: 'user',
          content: formattedQueryWithResults,
        },
      ],
    };
    try {
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 200000,
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  async searchQuery(id: string, query: string) {
    try {
      const database = await this.databaseRepository.findOne({ where: { id } });

      if (!database) {
        throw new InternalServerErrorException('Database not found');
      }

      const searchResponse = await this.search(database.name, query);
      if (
        searchResponse &&
        searchResponse.hits &&
        searchResponse.hits.length > 0
      ) {
        let formattedQuery = '---USER QUERY---\n' + query;
        const hitResults = searchResponse.hits.map((hit) => ({
          filename: hit.filename || hit.fileName,
          text: hit.text,
          pagenumber: hit.pagenumber,
          highlight:
            (hit._highlights || []).length > 0 ? hit._highlights[0].text : '',
          score: hit._score,
        }));

        if (hitResults.length > 0) {
          formattedQuery = this.createLLMQuery(formattedQuery, hitResults);
          const llmResponse = await this.queryLocalLLM(formattedQuery);
          if (llmResponse.id) {
            const responseTextOnly = llmResponse.choices[0].message.content;
            return {
              responseTextOnly,
              hitResults,
            };
          }
        }
        return {
          responseTextOnly: '',
          hitResults,
        };
      } else {
        return {
          responseTextOnly:
            "I could not find the information you're looking for. Please make sure you've selected the correct database or that the reference document has been uploaded properly.",
        };
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteDatabase(database_id: string) {
    const database = await this.databaseRepository.findOne({
      where: { id: database_id },
    });
    if (!database) {
      throw new InternalServerErrorException('Database not found');
    }

    const config = this.configService.getMarqoUrl();
    const marqoUrl = config.marqoUrl;
    const url = `${marqoUrl}/indexes/${database.name}`;

    try {
      const response = await this.apiService.delete(url);
      console.log(response, 'response');
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.data);
    }
    try {
      await this.databaseRepository.remove(database);
      return { message: 'Database Deleted Successfully' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
