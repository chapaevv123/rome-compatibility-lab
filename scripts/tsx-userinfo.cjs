// Windows sandbox environments may deny the account lookup used by tsx.
// Only supply the current account name when the OS lookup itself fails.
if (process.platform === 'win32') {
  const os = require('node:os');
  try {
    os.userInfo();
  } catch (error) {
    if (!process.env.USERNAME) throw error;
    os.userInfo = () => ({
      username: process.env.USERNAME,
      uid: -1,
      gid: -1,
      homedir: process.env.USERPROFILE || process.cwd(),
      shell: null,
    });
  }
}
