import { compileCode } from '@test/compileCode';
import TSFileLoader from '@test/TSFileLoader';
import fs from 'fs';
import path from 'path';
import packageJson from './../../package.json';

const rootDir = path.join(__dirname, '..', '..');

const tsFileLoader = new TSFileLoader({
  paths: [
    path.join(rootDir, 'node_modules', 'typescript', 'lib'),
    path.join(rootDir, 'node_modules', '@types', 'node')
  ],
  files: {
    // reads the contents of the `.d.ts` file pointed to in the `package.json`
    'strongly-typed-event-emitter.ts': fs.readFileSync(packageJson.types).toString(),
    'awesome-app.ts': `
export const api = {
  setAuthToken: (token: string) => {}
};

export const btns = {
  logout: { onclick: () => {} },
  save: { onclick: () => {} }
};
`
  }
});

describe('StronglyTypedEventEmitter', () => {
  //#region it matches the snapshot (each)
  test.each<[string, string]>([
    //#region The Problem
    [
      'The Problem',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { EventEmitter } from 'events';

const ee = new EventEmitter();

ee.on('e:user.login', data => {
  const token = data.tokne;

  api.setAuthToken(token);
});

ee.on('e:user.signout', data => {
  console.log(data.user.firstName, 'has signed out');
});

btns.logout.onclick = () => {
  ee.emit('e:user.logout', {});
};`
    ],
    //#endregion
    //#region The Solution
    [
      'The Solution',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

interface UserEventsMap {
  'e:user.login': { token: string };
  'e:user.logout': { user: { firstName: string } };
}

// note this can also be done as "const ee = new StronglyTypedEventEmitter<UserEventsMap>();"
const ee: StronglyTypedEventEmitter<UserEventsMap> = new EventEmitter();

ee.on('e:user.login', data => {
  // TS2551: Property 'tokne' does not exist on type '{ token: string; }'. Did you mean 'token'?
  const token = data.tokne;

  api.setAuthToken(token);
});

// TS2345: Argument of type '"e:user.signout"' is not assignable to parameter of type '"e:user.login" | "e:user.logout"'.
ee.on('e:user.signout', data => {
  alert('Come back soon!');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.logout', {});
};
`
    ],
    //#endregion
    //#region Enums as key
    [
      'Enums as keys',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

enum UserEvent {
  Login = 'e:user.login',
  Logout = 'e:user.logout'
}

interface UserEventsMap {
  [UserEvent.Login]: { token: string };
  [UserEvent.Logout]: { user: { firstName: string } };
}

// note this can also be done as "const ee = new StronglyTypedEventEmitter<UserEventsMap>();"
const ee: StronglyTypedEventEmitter<UserEventsMap> = new EventEmitter();

ee.on(UserEvent.Login, data => {
  // TS2551: Property 'tokne' does not exist on type '{ token: string; }'. Did you mean 'token'?
  const token = data.tokne;

  api.setAuthToken(token);
});

// TS2345: Argument of type '"e:user.signout"' is not assignable to parameter of type 'UserEvent'.
ee.on('e:user.signout', data => {
  alert('Come back soon!');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit(UserEvent.Logout, {});
};
`
    ],
    //#endregion
    //#region Events that don't have "data" (Caveat #1)
    [
      'Events that don\'t have "data" (Caveat #1)',
      // language=TEXT
      `
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

enum SocketEvent {
  Heartbeat = 'e:heartbeat'
}

interface SocketEventsMap {
  [SocketEvent.Heartbeat]: void;
}

// note this can also be done as "const ee = new StronglyTypedEventEmitter<SocketEventsMap>();"
const ee: StronglyTypedEventEmitter<SocketEventsMap> = new EventEmitter();

// TS2554: Expected 2 arguments, but got 1.
ee.emit(SocketEvent.Heartbeat);
// TS2345: Argument of type '{}' is not assignable to parameter of type 'void'.
ee.emit(SocketEvent.Heartbeat, {});

ee.emit(SocketEvent.Heartbeat, undefined);
`
    ],
    //#endregion
    //#region Merging with same keys
    [
      'Merging with same keys',
      // language=TEXT
      `
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

interface UserEventsMap {
  'e:user.save': {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface AdminEventsMap {
  'e:user.save': {
    user: { username: string; };
    roles: string[];
  };
}

// note this can also be done as "const ee = new StronglyTypedEventEmitter<UserEventsMap & AdminEventsMap>();"
const ee: StronglyTypedEventEmitter<UserEventsMap & AdminEventsMap> = new EventEmitter();

ee.on('e:user.save', data => {
  console.log(
    data.user.username,
    data.user.firstName,
    data.user.lastName,
    data.roles
  );
});
`
    ],
    //#endregion
    //#region Merging event maps
    [
      'Merging event maps',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

enum UserEvent {
  Login = 'e:user.login',
  Logout = 'e:user.logout'
}

interface UserAuthEventsMap {
  [UserEvent.Login]: { token: string };
  [UserEvent.Logout]: { user: { firstName: string } };
}

interface UserProfileEventsMap {
  'e:user.save': { user: { firstName: string } };
}

// note this can also be done as "const ee = new StronglyTypedEventEmitter<UserEventsMap & UserProfileEventsMap>();"
const ee: StronglyTypedEventEmitter<UserAuthEventsMap & UserProfileEventsMap> = new EventEmitter();

ee.on(UserEvent.Login, data => {
  // TS2551: Property 'tokne' does not exist on type '{ token: string; }'. Did you mean 'token'?
  const token = data.tokne;

  api.setAuthToken(token);
});

// TS2345: Argument of type '"e:user.signout"' is not assignable to parameter of type 'UserEvent | "e:user.save"'.
ee.on('e:user.signout', data => {
  alert('Come back soon!');
});

btns.save.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.save', {});
};
`
    ],
    //#endregion
    //#region Inheritance
    [
      'Inheritance',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';

enum UserEvent {
  Login = 'e:user.login',
  Logout = 'e:user.logout'
}

interface UserAuthEventsMap {
  [UserEvent.Login]: { token: string };
  [UserEvent.Logout]: { user: { firstName: string } };
}

class UserManager extends StronglyTypedEventEmitter<UserAuthEventsMap> {

}

const ee = new UserManager();

ee.on(UserEvent.Login, data => {
  // TS2551: Property 'tokne' does not exist on type '{ token: string; }'. Did you mean 'token'?
  const token = data.tokne;

  api.setAuthToken(token);
});

// TS2345: Argument of type '"e:user.signout"' is not assignable to parameter of type 'UserEvent'.
ee.on('e:user.signout', data => {
  alert('Come back soon!');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit(UserEvent.Logout, {});
};
`
    ],
    //#endregion
    //#region 2 degrees of inheritance
    [
      '2 degrees of inheritance',
      // language=TEXT
      `
import { api, btns } from 'awesome-app';
import { StronglyTypedEventEmitter, EventMap } from 'strongly-typed-event-emitter';

enum UserEvent {
  Login = 'e:user.login',
  Logout = 'e:user.logout'
}

interface UserAuthEventsMap {
  [UserEvent.Login]: { token: string };
  [UserEvent.Logout]: { user: { firstName: string } };
}

class UserAuthManager<T extends EventMap = {}> extends StronglyTypedEventEmitter<UserAuthEventsMap & T> {

}

interface UserProfileEventsMap {
  'e:user.save': { user: { firstName: string } };
}

class UserManager<T extends EventMap = {}> extends UserAuthManager<UserProfileEventsMap & T> {

}

const ee = new UserManager();

ee.on(UserEvent.Login, data => {
  // TS2551: Property 'tokne' does not exist on type '{ token: string; }'. Did you mean 'token'?
  const token = data.tokne;

  api.setAuthToken(token);
});

// TS2345: Argument of type '"e:user.signout"' is not assignable to parameter of type 'UserEvent | "e:user.save"'.
ee.on('e:user.signout', data => {
  alert('Come back soon!');
});

btns.save.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.save', {});
};
`
    ]
    //#endregion
  ])('%#: "%s"', (_, code) => {
    const results = compileCode(code, tsFileLoader);

    expect(results.diagnostics).toMatchSnapshot();
  });
  //#endregion
});
