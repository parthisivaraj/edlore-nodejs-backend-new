import { PaginationResponse } from '@app/schema/dto';

export class ModelResponseDto {
  id: string;
  title: string;
  model_id: string;
  linked_devices: number;
  which_category: string;
  primary_category?: any;
  secondary_category?: any;
  created_at: string;
}

export class ModelResponse {
  pagination: PaginationResponse;
  models: ModelResponseDto[];
}

export class ModelDetailsResponseDto {
  id: string;
  title: string;
  primary_category: any;
  secondary_category: SecondaryCategory;
  model_id: string;
  linked_devices: number;
  devices: Device[];
  procedures_count: number;
  message: string;
}

export class SecondaryCategory {
  id: string;
  name: string;
  super_category: SuperCategory;
}

export class SuperCategory {
  id: string;
  name: string;
}

export class Device {
  id: string;
  name: string;
  image: string;
  device_id: string;
  serial_number: string;
  status: string;
  created_at: string;
}
