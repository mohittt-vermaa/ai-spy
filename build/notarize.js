const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  // Skip notarization in CI unless explicitly enabled
  if (process.env.SKIP_NOTARIZE === 'true' || !process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.log('Skipping notarization (set APPLE_ID and APPLE_ID_PASSWORD to enable)');
    return;
  }

  return await notarize({
    tool: 'notarytool',
    appBundleId: 'com.aispy.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};