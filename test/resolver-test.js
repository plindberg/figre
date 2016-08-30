/* eslint-env node, mocha */
'use strict';

const ConfigResolver = require('../resolver');

const {expect} = require('chai');
const sinon = require('sinon');
const dotenv = require('dotenv');

describe('Configuration resolution', () => {

  context('Process environment context', () => {
    beforeEach(() => {
      process.env['TEST_GREETING'] = 'hello';
      process.env['TEST_LOGENTRIES_TOKEN'] = '27d2-6d-44fg';
      process.env['TEST_LOGENTRIES_LEVEL'] = 'trace';
    });

    afterEach(() => {
      delete process.env['TEST_GREETING'];
      delete process.env['TEST_LOGENTRIES_TOKEN'];
      delete process.env['TEST_LOGENTRIES_LEVEL'];
    });

    it('Resolves top-level configuration mappings', () => {
      const config = ConfigResolver.create({greeting: {_env: 'TEST_GREETING'}});
      expect(config).to.have.property('greeting', 'hello');
    });

    it('Resolves nested configuration mappings', () => {
      const config = ConfigResolver.create({
        logentries: {
          token: {_env: 'TEST_LOGENTRIES_TOKEN'},
          level: {_env: 'TEST_LOGENTRIES_LEVEL'}
        }
      });
      expect(config).to.have.deep.property('logentries.token', '27d2-6d-44fg');
      expect(config).to.have.deep.property('logentries.level', 'trace');
    });

    it('Throws an error if environment variable is missing', () => {
      expect(() => ConfigResolver.create({missing: {_env: 'NOT_THERE'}})).to.throw(/NOT_THERE/);
    });
  });

  context('Custom contexts', () => {
    it('Resolves with Cloud Foundry style environment', () => {
      const config = ConfigResolver.create({
        _context: {
          _cfenv: {port: 6006, bind: 'penny.ai', url: 'https://penny.ai:6006'}
        },
        httpServer: {
          bindingHost: {_cfenv: 'bind'},
          port: {_cfenv: 'port'},
          url: {_cfenv: 'url'}
        }
      });
      expect(config).to.have.deep.property('httpServer.bindingHost', 'penny.ai');
      expect(config).to.have.deep.property('httpServer.port', 6006);
      expect(config).to.have.deep.property('httpServer.url', 'https://penny.ai:6006');
    });
  });

  context('Serialised variables', () => {
    it('Resolves JSON serialised variables', () => {
      const config = ConfigResolver.create({
        _context: {
          _test: {jsonArray: '[1,2,3]', jsonObject: '{"a":1,"b":2,"c":3}'}
        },
        test: {
          array: {_test: 'jsonArray', _format: 'JSON'},
          object: {_test: 'jsonObject', _format: 'JSON'}
        }
      });
      expect(config).to.have.deep.property('test.array').which.deep.equals([1, 2, 3]);
      expect(config).to.have.deep.property('test.object').which.deep.equals({a: 1, b: 2, c: 3});
    });
  });

  describe('Conditionally loading .env file', () => {
    beforeEach(() => {
      sinon.stub(dotenv, 'config');
    });

    it('Loads .env file only if requested', () => {
      ConfigResolver.create({});
      expect(dotenv.config).to.not.have.been.called;
      ConfigResolver.create({_options: {loadEnvFile: true}});
      expect(dotenv.config).to.have.been.called;
    });
  });
});
