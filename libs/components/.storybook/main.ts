import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

// RN primitives the unistyles babel plugin swaps in. Pre-bundling them stops Vite
// from re-optimizing (and full-page reloading) the first time a story uses one.
const unistylesComponents = [
  'ActivityIndicator',
  'Animated',
  'FlatList',
  'Image',
  'ImageBackground',
  'KeyboardAvoidingView',
  'Pressable',
  'RefreshControl',
  'SafeAreaView',
  'ScrollView',
  'SectionList',
  'Switch',
  'Text',
  'TextInput',
  'TouchableHighlight',
  'TouchableOpacity',
  'View',
  'VirtualizedList',
];

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        babel: {
          plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
        },
      },
    },
  },
  viteFinal: (viteConfig) => {
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias ?? {}),
        // WebBottomTabs needs expo-router/ui; Storybook has no router — use a chrome mock.
        'expo-router/ui': path.join(storybookDir, 'mocks/expo-router-ui.tsx'),
      },
    };
    viteConfig.optimizeDeps = {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        'react-native-unistyles',
        ...unistylesComponents.map((name) => `react-native-unistyles/components/native/${name}`),
      ],
    };
    return viteConfig;
  },
};

export default config;
