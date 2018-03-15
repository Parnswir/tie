const { spawn, spawnSync } = require('child_process');
const { lstatSync, readdirSync } = require('fs');
const { dirname, join, sep, resolve } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory);

const runPipeline = (directories) => {
  if (directories.length > 0) {
    const directory = directories.shift()
    console.log(`============= ${directory} =============`)
    runWebpack(directory, () => runPipeline(directories));
  } else {
    process.exit(0);
  }
}

const runWebpack = (directory, callback) => {
  const configFile = `"${resolve(directory, 'webpack.config.js')}"`
  const webpackCommand = resolve(__dirname, 'node_modules/.bin/webpack');
  const webpack = spawn(webpackCommand, ['--config', configFile], {shell: true});

  webpack.stdout.pipe(process.stdout);
  webpack.stderr.pipe(process.stderr);

  webpack.on('exit', (code) => {
    console.log(`webpack exited with code ${code}`);
    if (code === 0) {
      runServer(directory, callback);
    } else {
      process.exit(code);
    }
  });
}

const runServer = (directory, callback) => {
  var name = require.resolve('node-http-server');
  delete require.cache[name];

  require('node-http-server').deploy(
    {
        port: 8080,
        root: directory
    },
    (server) => {
      launchTests(directory, () => {
        server.server.close(callback);
        delete server.server;
      });
    }
  );
}

const launchTests = (directory, callback) => {
  const suiteName = directory.split(sep).pop()
  const reportPath = `../../.integration/cypress-${suiteName}.xml`;
  const cypressCommand = resolve(__dirname, 'node_modules/.bin/cypress');
  const cypress = spawn(cypressCommand, [
                        'run', '--project', `"${directory}"`,
                        '--reporter', 'junit', '--reporter-options',
                        `"mochaFile=${reportPath}"`
                        ], {shell: true});

  cypress.stdout.pipe(process.stdout);
  cypress.stderr.pipe(process.stderr);

  cypress.on('exit', (code) => {
    if (code === 0) {
      callback();
    } else {
      console.warn(`cypress exited with code ${code}.`);
      process.exit(code);
    }
  });
}

const directories = getDirectories(resolve(__dirname, 'sample'));
runPipeline(directories);
