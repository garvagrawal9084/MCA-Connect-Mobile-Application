const fs = require('fs');
const path = require('path');

// 1. Patch warnOfExpoGoPushUsage.js to prevent throw on Android Expo Go
const warnFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'warnOfExpoGoPushUsage.js'
);

if (fs.existsSync(warnFile)) {
  let content = fs.readFileSync(warnFile, 'utf8');
  if (content.includes("throw new Error(message);")) {
    content = content.replace(
      /if\s*\(\s*Platform\.OS\s*===\s*'android'\s*\)\s*\{\s*throw new Error\(message\);\s*\}\s*else if\s*\(\s*__DEV__\s*\)\s*\{/g,
      "if (!didWarn) {"
    );
    fs.writeFileSync(warnFile, content, 'utf8');
    console.log('[patch] Patched expo-notifications warnOfExpoGoPushUsage for Android Expo Go');
  }
}

// 2. Patch TopicSubscriptionModule.android.js to gracefully handle missing native module in Expo Go
const topicFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'TopicSubscriptionModule.android.js'
);

if (fs.existsSync(topicFile)) {
  let content = fs.readFileSync(topicFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    content = `import { requireOptionalNativeModule } from 'expo-modules-core';

let nativeModule = null;
try {
  nativeModule = typeof requireOptionalNativeModule === 'function'
    ? requireOptionalNativeModule('ExpoTopicSubscriptionModule')
    : null;
} catch {}

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default nativeModule || fallbackModule;
`;
    fs.writeFileSync(topicFile, content, 'utf8');
    console.log('[patch] Patched expo-notifications TopicSubscriptionModule.android.js for Expo Go');
  }
}
