import ldap, { SearchOptions } from "ldapjs";
import jwt from "jsonwebtoken";
import { config } from "../config";

export class AuthService {
  private createClient() {
    return ldap.createClient({ url: config.ldapConfig.url });
  }

  private async findUserDN(username: string): Promise<string> {
    const client = this.createClient();
    return new Promise<string>((resolve, reject) => {
      // First bind with service account to search for user
      client.bind(
        config.ldapConfig.bindDN,
        config.ldapConfig.bindCredentials,
        (err) => {
          if (err) {
            client.unbind();
            return reject(err);
          }

          // Search for user by sAMAccountName or userPrincipalName
          const filter = `(|(sAMAccountName=${username})(userPrincipalName=${username}))`;
          const opts: SearchOptions = {
            scope: "sub",
            filter: filter,
            attributes: ["distinguishedName", "dn"],
          };

          client.search(config.ldapConfig.searchBase, opts, (err, res) => {
            if (err) {
              client.unbind();
              return reject(err);
            }

            let userDN: string | null = null;
            res.on("searchEntry", (entry) => {
              // Get the DN from the entry
              userDN = entry.attributes.find(attr => attr.type === "distinguishedName")?.values[0] || null;
            });

            res.on("error", (err) => {
              client.unbind();
              reject(err);
            });

            res.on("end", () => {
              client.unbind();
              if (userDN) {
                resolve(userDN);
              } else {
                reject(new Error("User not found"));
              }
            });
          });
        }
      );
    });
  }

  private async bindAsUser(
    username: string,
    password: string
  ): Promise<string> {
    // First find the user's DN
    const userDN = await this.findUserDN(username);
    
    // Then authenticate with the found DN
    const client = this.createClient();
    return new Promise<string>((resolve, reject) => {
      client.bind(userDN, password, (err) => {
        client.unbind();
        if (err) return reject(err);
        resolve(userDN);
      });
    });
  }

  private async isMemberOfGroup(
    userDN: string,
    groupDN: string
  ): Promise<boolean> {
    const client = this.createClient();
    return new Promise<boolean>((resolve, reject) => {
      client.bind(
        config.ldapConfig.bindDN,
        config.ldapConfig.bindCredentials,
        (err) => {
          if (err) reject(err);
          const opts: SearchOptions = {
            scope: "base",
            filter: `(member=${userDN})`,
            attributes: ["cn"],
          };
          client.search(groupDN, opts, (err, res) => {
            if (err) reject(err);
            let found = false;
            res.on("searchEntry", () => {
              found = true;
            });
            res.on("error", (err) => reject(err));
            res.on("end", () => {
              client.unbind();
              resolve(found);
            });
          });
        }
      );
    });
  }

  async authenticate(username: string, password: string) {
    try {
      const userDN = await this.bindAsUser(username, password);
      const isMember = await this.isMemberOfGroup(
        userDN,
        config.ldapConfig.authorizedGroup
      );

      if (!isMember) {
        throw new Error("User is not a member of the authorized group");
      }

      const accessToken = jwt.sign({ username, dn: userDN }, config.jwtSecret, {
        expiresIn: "1h",
      });
      return { accessToken };
    } catch (err: any) {
      if (err.message === "User not found") {
        throw new Error("Authentication failed: User not found");
      }
      throw new Error("Authentication failed with reason: " + err.message);
    }
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw new Error("Invalid token");
    }
  }
}

export const authService = new AuthService();
