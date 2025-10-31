import { SearchEntry } from "ldapjs";
import { sidBufferToString } from 'security-identifier';

export class ResultParser {
  static parseLDAPSearchEntry(entry: SearchEntry): any {
    const { attributes }  = entry;
    const result: any = {};
    attributes.forEach(attr => {
      result[attr.type] = attr.values.length > 1 ? attr.values : attr.values[0];
      if (attr.type === "objectSid") {
        // Convert Buffer to string representation of SID
        const sidBuffer = attr.values[0];
        result[attr.type] = sidBufferToString(Buffer.from(sidBuffer as string));
      }
    });
    return result;
  }
}