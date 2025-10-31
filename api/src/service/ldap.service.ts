import { resolve } from "path";
import { config } from "../config";
import { User } from "../types/user";
import ldap, { SearchOptions } from "ldapjs";
import { ResultParser } from "../utils/resultparser";

export class LdapService {
  private client: ldap.Client;
  private defaultAttributes = [
    "cn",
    "name",
    "userPrincipalName",
    "sAMAccountName",
    "logonCount",
    "lastLogonTimestamp",
    "memberOf",
    "objectSid"
  ];
  private groupOU = `CN=Users,${config.ldapConfig.baseDN}`;

  constructor() {
    this.client = ldap.createClient({ url: config.ldapConfig.url });
  }

  async bindAdmin() {
    return new Promise<void>((resolve, reject) => {
      this.client.bind(
        config.ldapConfig.bindDN,
        config.ldapConfig.bindCredentials,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  async getUsers() {
    await this.bindAdmin();
    const opts: SearchOptions = {
      filter: "(objectClass=user)",
      scope: "sub",
      attributes: this.defaultAttributes,
    };

    return new Promise((resolve, reject) => {
      const entries: any[] = [];
      this.client.search(config.ldapConfig.searchBase, opts, (err, res) => {
        if (err) return reject(err);
        res.on("searchEntry", (entry) =>
          entries.push(ResultParser.parseLDAPSearchEntry(entry))
        );
        res.on("error", (err) => reject(err));
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
      userPassword: password,
    };

    return new Promise<void>((resolve, reject) => {
      this.client.add(dn, newUser, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async searchUsers(
    filter: string = "(objectClass=user)",
    attributes = this.defaultAttributes
  ) {
    await this.bindAdmin();
    const opts = { filter, scope: "sub", attributes } as SearchOptions;

    return new Promise((resolve, reject) => {
      const results: any[] = [];
      this.client.search(config.ldapConfig.searchBase, opts, (err, res) => {
        if (err) return reject(err);
        res.on("searchEntry", (entry) =>
          results.push(ResultParser.parseLDAPSearchEntry(entry))
        );
        res.on("error", (e) => reject(e));
        res.on("end", () => resolve(results));
      });
    });
  }

  async getUserBySAMAccountName(sam: string): Promise<any | null> {
    const filter = `(sAMAccountName=${sam})`;
    const results = (await this.searchUsers(filter)) as any[];
    return results[0] || null;
  }

  async createGroup(name: string, description?: string) {
    await this.bindAdmin();
    const dn = `cn=${name},${this.groupOU}`;
    const entry = {
      cn: name,
      objectClass: ["top", "group"],
      description: description || "",
    };
    await new Promise((resolve, reject) => {
      this.client.add(dn, entry, (err) => {
        if (err) return reject(err);
        resolve({ message: `Group ${name} created successfully` });
      });
    });
  }

  async deleteGroup(name: string) {
    await this.bindAdmin();
    const dn = `cn=${name},${this.groupOU}`;
    await new Promise((resolve, reject) => {
      this.client.del(dn, (err) => {
        if (err) return reject(err);
        resolve({ message: `Group ${name} deleted successfully` });
      });
    });
  }

  async addUserToGroup(username: string, groupName: string) {
    await this.bindAdmin();
    const userDN = `cn=${username},${config.ldapConfig.searchBase}`;
    const groupDN = `cn=${groupName},${this.groupOU}`;
    console.log(`Adding userDN ${userDN} to groupDN ${groupDN}`);

    const change = new ldap.Change({
      operation: "add",
      modification: new ldap.Attribute({
        type: "member",
        values: [userDN],
      })
    });

    await new Promise((resolve, reject) => {
      this.client.modify(groupDN, change, (err) => {
        if (err) return reject(err);
        resolve({ message: `User ${username} added to group ${groupName}` });
      });
    });
  }

  async removeUserFromGroup(username: string, groupName: string) {
    await this.bindAdmin();
    const userDN = `CN=${username},${config.ldapConfig.searchBase}`;
    const groupDN = `CN=${groupName},${this.groupOU}`;

    const members = await this.getGroupMembers(groupName);
    if (!members.includes(userDN)) {
      return Promise.resolve({ error: true, message: `User ${username} is not a member of group ${groupName}` });
    }

    const updatedMembers = members.filter(member => member !== userDN);

    const change = new ldap.Change({
      operation: "replace",
      modification: new ldap.Attribute({
        type: "member",
        values: updatedMembers,
      })
    });

    await new Promise((resolve, reject) => {
      this.client.modify(groupDN, change, (err) => {
        if (err) return reject(err);
        resolve({
          message: `User ${username} removed from group ${groupName}`,
        });
      });
    });
  }

  async getGroupMembers(groupName: string): Promise<string[]> {
    await this.bindAdmin();
    const opts: SearchOptions = {
      filter: `(cn=${groupName})`,
      scope: "sub",
      attributes: ["member"],
    };

    return new Promise((resolve, reject) => {
      this.client.search(this.groupOU, opts, (err, res) => {
        if (err) return reject(err);
        let members: string[] = [];
        res.on("searchEntry", (entry) => {
          const parsed = ResultParser.parseLDAPSearchEntry(entry);
          if (Array.isArray(parsed.member)) {
            members = parsed.member;
          } else if (parsed.member) {
            members = [parsed.member];
          }
        });
        res.on("error", (err) => reject(err));
        res.on("end", () => resolve(members));
      });
    });
  }

  async listGroups() {
    await this.bindAdmin();
    const opts: SearchOptions = {
      filter: "(objectClass=group)",
      scope: "one",
      attributes: ["name", "cn", "description", "distinguishedName", "whenCreated", "whenChanged", "member", "memberOf", "objectSid"]
    };

    return new Promise((resolve, reject) => {
      const entries: any[] = [];
      this.client.search(this.groupOU, opts, (err, res) => {
        if (err) return reject(err);
        res.on("searchEntry", (entry) =>
          entries.push(ResultParser.parseLDAPSearchEntry(entry))
        );
        res.on("error", (err) => reject(err));
        res.on("end", () => resolve(entries));
      });
    });
  }

  async getGroupInformation(groupName: string) {
    await this.bindAdmin();
    const opts: SearchOptions = {
      filter: `(cn=${groupName})`,
      scope: "one",
      attributes: ["name", "cn", "description", "distinguishedName", "whenCreated", "whenChanged", "member", "memberOf", "objectSid"]
    };

    return new Promise((resolve, reject) => {
      let groupInfo: any = null;
      this.client.search(this.groupOU, opts, (err, res) => {
        if (err) return reject(err);
        res.on("searchEntry", (entry) => {
          groupInfo = ResultParser.parseLDAPSearchEntry(entry);
        });
        res.on("error", (err) => reject(err));
        res.on("end", () => resolve(groupInfo));
      });
    });
  }
}

export const ldapService = new LdapService();
