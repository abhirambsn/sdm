import { exec } from "child_process";
import util from 'util';
const execPromise = util.promisify(exec);

export class SambaService {
  async createUser(username: string, password: string): Promise<void> {
    const cmd = `sambda-tool user create ${username} ${password}`;
    await execPromise(cmd);
  }

  async disableUser(username: string): Promise<void> {
    const cmd = `samba-tool user disable ${username}`;
    await execPromise(cmd);
  }
}