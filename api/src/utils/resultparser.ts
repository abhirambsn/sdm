import { SearchEntry } from "ldapjs";

export class ResultParser {
  static parseLDAPSearchEntry(entry: SearchEntry): any {
    const { attributes }  = entry;
    const result: any = {};
    attributes.forEach(attr => {
      result[attr.type] = attr.values.length > 1 ? attr.values : attr.values[0];
    });
    return result;
  }
}