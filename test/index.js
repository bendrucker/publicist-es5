'use strict'

/*global describe,beforeEach,afterEach,it*/

import assert from 'assert'
import * as es5 from '../'
import {Package as Pack} from 'packhorse'
import {sync as rmSync} from 'rimraf'
import {mkdirSync, readFileSync} from 'fs'
import {resolve} from 'path'
import {ncp as cp} from 'ncp'

describe('publicist-es5', function () {
  const working = resolve(__dirname, 'working')
  this.timeout(5000)

  beforeEach((done) => {
    mkdirSync(working)
    cp(resolve(__dirname, 'fixtures'), working, done)
  })
  afterEach(() => {
    rmSync(working)
  })

  function build (testCase) {
    return new Pack(resolve(working, `${testCase}/package.json`))
      .read()
      .then((pack) => {
        return es5.build(pack, es5.defaults(pack, {
          dest: resolve(working, `${testCase}/output`),
          src: resolve(working, `${testCase}/src/*.js`)
        }))
      })
  }
  describe('main', () => {
    it('transpiles es6 to es5 with babel', () => {
      return build('normal').then(() => {
        assert.equal(require('./working/normal/output'), 'foo')
      })
    })
  })

  describe('after', () => {
    it('updates the package.json "main"', () => {
      return new Pack(resolve(working, 'normal/package.json'))
        .read()
        .then((pack) => {
          es5.after(pack, es5.defaults(pack, {
            dest: resolve(working, 'normal/output'),
            src: resolve(working, 'normal/src/*.js')
          }))
          assert.equal(pack.get('main'), './output')
        })
    })

    it('updates the package.json "main" with non-index', () => {
      return new Pack(resolve(working, 'main-non-index/package.json'))
        .read()
        .then((pack) => {
          es5.after(pack, es5.defaults(pack, {
            dest: resolve(working, 'main-non-index/output'),
            src: resolve(working, 'main-non-index/src/*.js')
          }))
          assert.equal(pack.get('main'), './output/code.js')
        })
    })

    it('obeys the "main" use of leading "./"', () => {
      return new Pack(resolve(working, 'normal/package.json'))
        .read()
        .then((pack) => {
          return pack.set('main', 'src').write()
        })
        .then((pack) => {
          es5.after(pack, es5.defaults(pack, {
            dest: resolve(working, 'normal/output'),
            src: resolve(working, 'normal/src/*.js')
          }))
          assert.equal(pack.get('main'), 'output')
        })
    })

    it('removes the babelify transform', () => {
      return new Pack(resolve(working, 'normal/package.json'))
        .read()
        .then((pack) => {
          return pack.set('browserify.transform', ['babelify']).write()
        })
        .then((pack) => {
          es5.after(pack, es5.defaults(pack, {
            dest: resolve(working, 'normal/output'),
            src: resolve(working, 'normal/src/*.js')
          }))
          assert.equal(pack.get('browserify.transform.length'), 0)
        })
    })

    it('removes the babelify transform with options', () => {
      return new Pack(resolve(working, 'normal/package.json'))
        .read()
        .then((pack) => {
          return pack.set('browserify.transform', [['babelify', {}]]).write()
        })
        .then((pack) => {
          es5.after(pack, es5.defaults(pack, {
            dest: resolve(working, 'normal/output'),
            src: resolve(working, 'normal/src/*.js')
          }))
          assert.equal(pack.get('browserify.transform.length'), 0)
        })
    })
  })
})
