import { ContactModel, EntityContact } from 'api';

// interface UIContact extends EntityContact {
//     color?: string;
//     charAvatar?: string;
//     labelPoint?: boolean;
//     defaultEmail?: string;
//     type: 'personal' | 'enterprise' | string
// }

// export interface UIContactModel extends ContactModel {
//     contact: UIContact
// }

interface MailEntryModel {
  id: string;
  title?: string;
  brief?: string;
  content?: string;
  attachment?: [];
  mark?: string | boolean;
  replayed?: boolean;
  sendTime: string;
  readStatus: string;
  sendStatus: string;
}
export interface MailModel {
  send?: 'string';
  reciever?: string[];
  entry: MailEntryModel;
}
