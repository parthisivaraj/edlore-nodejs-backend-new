import {
  InsertEvent,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { Model, Section } from '../model';

@EventSubscriber()
export class ModelSubscriber implements EntitySubscriberInterface<Model> {
  listenTo() {
    return Model;
  }

  async afterInsert(event: InsertEvent<Model>) {
    const generalSection = new Section();
    generalSection.title = 'General Section';
    generalSection.model_id = event.entity;
    await event.manager.getRepository(Section).save(generalSection);
  }
}
