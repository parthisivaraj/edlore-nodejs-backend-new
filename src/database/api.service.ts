/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '@app/config';

const onSuccess = (response) => response.data;

const onError = async (error) =>
  Promise.reject({
    ...(error?.response || {}),
  });

@Injectable()
export class APIService {
  constructor(private configService: AppConfigService) {}

  async request(options) {
    const { marqoUrl, marqoApiKey } = this.configService.getMarqoUrl();

    const headers = {
      'x-api-key': marqoApiKey,
    };

    const client = axios.create({
      baseURL: marqoUrl,
      headers,
      timeout: 60000 * 10,
    });

    return client(options)
      .then((response) => response.data)
      .catch((error) => {
        console.error('API Error:', error?.response?.data || error.message);
        return Promise.reject(error?.response || error);
      });
  }

  get(url: string) {
    return this.request({
      url,
      method: 'GET',
    });
  }

  post(url, data) {
    return this.request({
      url,
      method: 'POST',
      data,
    });
  }

  delete(url) {
    return this.request({
      url,
      method: 'DELETE',
    });
  }

  extenralAPICall(url, method, data) {
    const headers = {};

    //headers['x-api-key'] = marqo.marqoApiKey;

    const client = axios({
      url,
      method,
      headers,
      data,
      timeout: 600000 * 1000,
    });
    return client.then(onSuccess).catch(onError);
  }
}
