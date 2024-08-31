import React from 'react';
import { expect } from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import KeyEventState from '../../src/const/KeyEventState';
import { GlobalHotKeys, HotKeys } from '../../src';
import FocusableElement from '../support/FocusableElement';

describe('Simulating keypress events hidden by cmd:', function () {
  context('when HotKeys and GlobalHotkeys are mounted at the same time', () => {
    context('and there is NO action bound to the cmd combination', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'enter'
        };

        this.globalKeyMap = {
          'ACTION2': 'enter'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.globalHandlers = {
          'ACTION2': sinon.spy()
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" ref={(element) => this.childElement = element}/>

            <GlobalHotKeys
              keyMap={this.globalKeyMap}
              handlers={this.globalHandlers}
            />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );

        this.keyEventManager = KeyEventManager.getInstance();

        this.targetElement = new FocusableElement(this.wrapper, '.childElement', {nativeElement: this.reactDiv});
        this.targetElement.focus();
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
        this.targetElement.keyDown(Key.COMMAND);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyDown(Key.A);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyUp(Key.COMMAND);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);
      });
    });

    context('and there is an action bound to the cmd combination', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'cmd+a'
        };

        this.globalKeyMap = {
          'ACTION2': 'enter'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.globalHandlers = {
          'ACTION2': sinon.spy()
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" ref={(element) => this.childElement = element}/>

            <GlobalHotKeys
              keyMap={this.globalKeyMap}
              handlers={this.globalHandlers}
            />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );

        this.keyEventManager = KeyEventManager.getInstance();

        this.targetElement = new FocusableElement(this.wrapper, '.childElement', {nativeElement: this.reactDiv});
        this.targetElement.focus();
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
        this.targetElement.keyDown(Key.COMMAND);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyDown(Key.A);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyUp(Key.COMMAND);

        expect(this.keyEventManager.focusOnlyEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager.globalEventStrategy.keyHistory.toJSON()).to.eql([
          {
            'keys': {
              'Meta': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
              ],
              'a': [
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);
      });
    });
  });
});
