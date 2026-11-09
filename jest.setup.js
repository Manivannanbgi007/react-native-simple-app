// Runs before every test file (configured in package.json -> "jest.setupFiles").

// Tests have no real phone screen, so there are no notches or system bars to
// measure. The library ships a mock that reports fixed safe-area insets.
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Icons load font files through expo-font, which is not needed to test app
// behaviour. Rendering nothing keeps the tests fast and focused.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
