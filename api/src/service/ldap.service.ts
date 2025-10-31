import { resolve } from "path";
import { config } from "../config";
import { User } from "../types/user";
import ldap, { SearchOptions } from "ldapjs";
import { ResultParser } from "../utils/resultparser";


export class LdapService {
  private client: ldap.Client;

  constructor() {
    this.client = ldap.createClient({ url: config.ldapConfig.url })
  }

  async bindAdmin() {
    return new Promise<void>((resolve, reject) => {
      this.client.bind(config.ldapConfig.bindDN, config.ldapConfig.bindCredentials, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async getUsers() {
    await this.bindAdmin();
    const opts: SearchOptions = {
      filter: "(objectClass=user)",
      scope: "sub",
      attributes: ["cn", "name", "userPrincipalName", "sAMAccountName", "logonCount", "lastLogonTimestamp", "memberOf"]
    };

    return new Promise((resolve, reject) => {
      const entries: any[] = [];
      this.client.search(config.ldapConfig.searchBase, opts, (err, res) => {
        if (err) return reject(err);
        res.on("searchEntry", entry => entries.push(ResultParser.parseLDAPSearchEntry(entry)));
        res.on("error", err => reject(err));
        res.on("end", () => resolve(entries));
      });
    });
  }


  async addUser(cn: string, password: string) {
    await this.bindAdmin();
    const dn = `cn=${cn},cn=Users,${config.ldapConfig.searchBase}`;
    const newUser = {
      cn,
      sn: cn,
      objectClass: ["top", "person", "organizationalPerson", "user"],
      userPassword: password
    };

    return new Promise<void>((resolve, reject) => {
      this.client.add(dn, newUser, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}