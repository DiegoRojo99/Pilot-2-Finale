const fs = require('fs');
const path = require('path');

function readEnvValue(name) {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return undefined;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    const prefix = `${name}=`;
    const line = lines.find((entry) => entry.trim().startsWith(prefix));

    if (!line) return undefined;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), 'expo-secure-store'],
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || readEnvValue('EXPO_PUBLIC_API_BASE_URL'),
  },
});