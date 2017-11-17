import test from 'ava';
import sinon from 'sinon';

import JSONLoader from '../src/JSONLoader';
import * as Request from '../src/request';

const fakeRequest = (fn) => {
  if (Request.getResource.restore) {
    Request.getResource.restore();
  }
  sinon.stub(Request, 'getResource').callsFake(fn);
}

test.serial('#load works for simple JSON files', async t => {
  const OBJECT = {foo: 'bar'};
  fakeRequest((path) => Promise.resolve(OBJECT));
  const result = await JSONLoader.load('some.json');
  t.deepEqual(result[0], OBJECT);
});

test.serial('#load merges JSON files based on simple spec', async t => {
  const FILE1 = {
    foo: 'bar',
    baz: {
      _load: 'file2.json'
    }
  };
  const FILE2 = 42;
  const EXPECTED = {
    foo: 'bar',
    baz: FILE2
  }
  fakeRequest((file) => {
    const resource = file === 'file1.json' ? FILE1 : FILE2;
    return Promise.resolve(resource);
  });
  const result = await JSONLoader.load('file1.json');
  t.deepEqual(result[0], EXPECTED);
});

test.serial('#load overrides specified attributes in merged json', async t => {
  const FILE1 = {
    foo: 'bar',
    baz: {
      _load: 'file2.json',
      _override: {
        test: 42
      }
    }
  };
  const FILE2 = {
    spam: 'eggs',
    test: 'hello world'
  };
  const EXPECTED = {
    foo: 'bar',
    baz: {
      spam: 'eggs',
      test: 42
    }
  }
  fakeRequest((file) => {
    const resource = file === 'file1.json' ? FILE1 : FILE2;
    return Promise.resolve(resource);
  });
  const result = await JSONLoader.load('file1.json');
  t.deepEqual(result[0], EXPECTED);
});

test.serial('#load only merges 10 levels deep', async t => {
  const FILES = {
    'file1.json': {foo: {_load: 'file2.json'}},
    'file2.json': {foo: {_load: 'file3.json'}},
    'file3.json': {foo: {_load: 'file4.json'}},
    'file4.json': {foo: {_load: 'file5.json'}},
    'file5.json': {foo: {_load: 'file6.json'}},
    'file6.json': {foo: {_load: 'file7.json'}},
    'file7.json': {foo: {_load: 'file8.json'}},
    'file8.json': {foo: {_load: 'file9.json'}},
    'file9.json': {foo: {_load: 'file10.json'}},
    'file10.json': {foo: {_load: 'file11.json'}},
    'file11.json': {foo: 'bar'}
  }

  const EXPECTED = {
    foo: 'bar',
    baz: {
      spam: 'eggs',
      test: 42
    }
  }
  fakeRequest((file) => {
    return Promise.resolve(FILES[file]);
  });

  await t.throws(JSONLoader.load('file1.json'));
});

test.serial('#load works for multiple files', async t => {
  const FILE1 = {
    foo: 'bar',
    baz: 42
  };
  const FILE2 = {
    'hello': 'world'
  };
  fakeRequest((file) => {
    const resource = file === 'file1.json' ? FILE1 : FILE2;
    return Promise.resolve(resource);
  });

  const result = await JSONLoader.load('file1.json', 'file2.json');
  t.deepEqual(result, [FILE1, FILE2]);
});
