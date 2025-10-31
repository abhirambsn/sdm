import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  LDAP_URL: process.env.LDAP_URL || "ldap://mock.local",
  ldapConfig: {
    url: process.env.LDAP_URL || "ldap://mock.local",
    bindDN: process.env.LDAP_BIND_DN || "cn=admin,dc=example,dc=com",
    bindCredentials: process.env.LDAP_BIND_CREDENTIALS || "adminpassword",
    searchBase: process.env.LDAP_SEARCH_BASE || "dc=example,dc=com",
    searchFilter: process.env.LDAP_SEARCH_FILTER || "(uid={{username}})",
    baseDN: process.env.LDAP_BASE_DN || "dc=example,dc=com",
    authorizedGroup: process.env.AUTHORIZED_GROUP_DN || "cn=Domain Admins,ou=groups,dc=example,dc=com",
  },
  smbToolPath: process.env.SMB_TOOL_PATH || "/usr/bin/samba-tool",
  smbToolEnabled: process.env.SMB_TOOL_ENABLED === "true" || false,
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  smbBackupPath: process.env.SMB_BACKUP_PATH || "/tmp/samba_backups",
};
