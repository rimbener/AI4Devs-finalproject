import { configure } from '@testing-library/react-native';

configure({ asyncUtilTimeout: 2000 });
jest.setTimeout(8000);
