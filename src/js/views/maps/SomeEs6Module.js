import { hello, goodbye } from 'es6!views/maps/some-functions';

import SomeRequireJsModule from 'views/maps/SomeRequireJsModule'

export class SomeEs6Module {
  constructor() {
    console.log(`${hello()}, and ${goodbye()}!`);
    // Instantiate for side effects.
    console.log({SomeRequireJsModule});
    new SomeRequireJsModule();
  }
}