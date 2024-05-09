import { JSDOM } from 'jsdom';
import Input from './Input';

jest.mock('three');

describe('Input', () => {
  test('Placeholder', () => {
    // TODO: Add the tests for Input asap
    const dom = new JSDOM();
    const domElement = dom.window.document.createElement('canvas');
    const input = new Input(domElement);
  });
});
