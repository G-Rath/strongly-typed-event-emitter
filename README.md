# @g-rath/strongly-typed-event-emitter

This is a strongly typed version of the Node [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter).

## The Problem

Node provides an `EventEmitter` class, that is great for doing custom event emitting.
It's sweet and simple, providing exactly what you need and saving you from an extra package, or having to manage a custom implementation.

The problem however is that this class is weakly typed with `any` - This is understandable since there is no way to know anything about the users events:

```typescript
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
};
```

The example above highlights how using `EventEmitter`s in `TypeScript` can let a number of bugs slip by:
  * You don't get warned if you use properties that don't exist (like `tokne`)
    * This can be mitigated by annotating the parameters type, but still annoying, since you have to track down the type.
  * When renaming or removing events, you won't get told of where they're used, and so risk not catching every usage in your app.
  * When emitting an event, you'll not get any warning about missing properties on the data parameter.

On top of this, you'll also not get autocompleting anywhere near `EventEmitter`s, leaving you to run around tracking types & event keys down.

Finally, while you could try and solve this with inheritance, you'll run into overloading problems that'll mean `TypeScript` either errors, still doesn't enforce strong types,
or require some really hack-y typings that will likely cause IDEs (and maybe even `TypeScript) to bail out, ruining any chance of autocompletion.

## The Solution

Enter `StronglyTypedEventEmitter`, a strongly typed version of the `EventEmitter`. This declared class takes a `Record` that maps event keys to their emitted data as a generic parameter,

This is actually just a re-declaration of the Node `EventEmitter`, meaning at runtime there is no extra overhead - it's the same as if you'd used `EventEmitter` directly.

In addition to providing a type, this package also provides a re-export of the Node `EventEmitter` as `StronglyTypedEventEmitter`, letting you use inheritance
while still not incurring a runtime cost (aside from the extra import - more on this in the inheritance examples):

```typescript
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
  console.log(data.user.firstName, 'has signed out');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.logout', {});
};
```

There are two caveats with this package:

1. You must pass a value to `emit`, even if that value is `undefined`.
2. You can only have one "event" parameter - `...args` is not supported.

## Usage:

You can create a strongly typed emitter by using either a type annotation, or calling `new` on `StronglyTypedEventEmitter` directly:

```typescript
import { EventEmitter } from 'events';
import { StronglyTypedEventEmitter } from 'strongly-typed-event-emitter';
 
const ee1: StronglyTypedEventEmitter<{}> = new EventEmitter();
const ee2 = new StronglyTypedEventEmitter<{}>();
```

The syntax for the generic event map is `Record<PropertyKey, unknown>`.

Full autocompleting in IDEs such as `WebStorm` are expected work, along with type checking by `TypeScript`.
If you're having problems or unexpected results with either of these features, please make an issue on this repo.

Here are some examples of `StronglyTypedEventEmitter` in action:

### Enums as keys

You can use enums as keys just fine. Note that this will lock you into using the enum; you can't pass the value of a key of the enum.
This isn't strictly a bad thing, but it means you *must* export your enum if you want to use it outside of the file its in.

```typescript
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
  console.log(data.user.firstName, 'has signed out');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit(UserEvent.Logout, {});
};
```

### Events that don't have `data` (Caveat #1)

This is the first caveat of this package - if you have an event with no `data`,
you still have to pass a second parameter to `emit` (and other such functions):

```typescript
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
```

### Merging event maps

Merging works just fine too!

```typescript
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
  console.log(data.user.firstName, 'has signed out');
});

btns.save.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.save', {});
};
```

You can even merge events with the same key:

```typescript
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
```

You should be careful while doing this however - don't mistake the result for a union.

### Inheritance

Finally, you can extend from `StronglyTypedEventEmitter` just fine:

```typescript
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
  console.log(data.user.firstName, 'has signed out');
});

btns.logout.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit(UserEvent.Logout, {});
};
```

### 2 degrees of inheritance

If you're using inheritance, it's recommended that you add an optional generic parameter to your class,
that is merged into `StronglyTypedEventEmitter`.

That way, if anyone extends your class, they can add their own events:

```typescript
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
  console.log(data.user.firstName, 'has signed out');
});

btns.save.onclick = () => {
  // TS2345: Argument of type '{}' is not assignable to parameter of type '{ user: { firstName: string; }; }'.
  ee.emit('e:user.save', {});
};
```

## Contributing

The most important thing when contributing is to make sure to add information about changes to the `CHANGELOG.md`,
ideally before publishing a new version. If you're not confident doing this, just ensure you provide primary maintainers
as much information as possible, particular about any special rules or gotchas that are a result of your change.

#### Linting

To run `eslint` on the project, run:

```
npm run lint 
```

#### Testing

There is no real way to test this kind of package - instead, jest snapshots are used
to ensure all changes that are made result in a known (and therefore expected) reaction from TypeScript.

These snapshots are based off the code examples in this README.

Whenever a change is made, these snapshot tests should be run, and updated as needed.

To run `jest` on the project, run:

```
npm run test
```

#### Checking

To check that the project is type safe, run:

```
npm run check
```

#### Compiling

To compile the project using `TypeScript`, run:

```
npm run compile
```

#### Changelog

This package uses a `CHANGELOG.md` to track, note, and describe changes to its surface.

All documentable changes should be, being placed under the appropriate header in the `CHANGELOG`.

Note that the `CHANGELOG` is *not* fixed - it's perfectly reasonable to edit it after the fact, for whatever reason.

The version headers of the `CHANGELOG` are automated by an `npm-version` script, located in the `scripts` folder,
When run, the script will insert a new version header below the `[Unreleased]` header.

The version header is enclosed in a link, linking to the comparing page for the repo 
(to allow users to easily bring up a full git comparision between the new & previous versions of the package),
 and has the date of the release at the end. 

#### Tagging, Versioning & Publishing

We use [SemVer](http://semver.org/) for versioning.

Tags should match the release versions, with a prefixing `v`

Both publishing & versioning should be done using `npm`, which'll also handle tags.

To publish a new version of this package, use `npm publish`.

There is an `npm-version` script located in the `scripts` folder of the repo,
that handles keeping the `CHANGELOG` headers in sync with new package versions. 

