import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../../src/';
import KeyCode from '../../support/Key';
import FocusableElement from '../../support/FocusableElement';

describe('Nested key map definitions:', () => {
  before(function () {
    this.outerKeyMap = {
      'ACTION1_OUTER': 'a',
      'ACTION2_OUTER': 'b',
    };

    this.innerKeyMap = {
      'ACTION1_INNER': 'a',
      'ACTION3_INNER': 'c',
    };
  });

  context('when components are nested with overlapping key maps', () => {
    context('and only the outer component has handlers defined', () => {
      beforeEach(function () {
        this.action1OuterHandler = sinon.spy();
        this.action2Handler = sinon.spy();
        this.action1InnerHandler = sinon.spy();
        this.action3Handler = sinon.spy();

        const handlers = {
          'ACTION1_OUTER': this.action1OuterHandler,
          'ACTION2_OUTER': this.action2Handler,
          'ACTION1_INNER': this.action1InnerHandler,
          'ACTION3_INNER': this.action3Handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} handlers={handlers}>
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        context('when keys that match an action defined only in the outer component are pressed', () => {
          it('then calls the handler for the action defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action2Handler).to.have.been.called;

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then does NOT call any handlers', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1OuterHandler).to.have.been.called;

            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.innerChildElement');
          this.targetElement.focus();
        });

        context('when keys that match an action defined only in the outer component are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action2Handler).to.have.been.called;

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then does NOT trigger any action', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action2Handler).to.not.have.been.called;

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1OuterHandler).to.have.been.called;
            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

      });

    });

    context('and only the inner component has handlers defined', () => {
      beforeEach(function () {
        this.action1OuterHandler = sinon.spy();
        this.action2Handler = sinon.spy();
        this.action1InnerHandler = sinon.spy();
        this.action3Handler = sinon.spy();

        const handlers = {
          'ACTION1_OUTER': this.action1OuterHandler,
          'ACTION2_OUTER': this.action2Handler,
          'ACTION1_INNER': this.action1InnerHandler,
          'ACTION3_INNER': this.action3Handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} >
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap} handlers={handlers}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        context('when keys that match an action defined only in the outer component are pressed', () => {
          it('then does NOT call any handlers', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then does NOT call any handlers', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then does NOT call any handlers', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement =
            new FocusableElement(this.wrapper, '.innerChildElement');

          this.targetElement.focus();
        });

        context('when keys that match an action defined only in the outer component are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action2Handler).to.have.been.called;

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then calls the handler defined in the inner component', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action3Handler).to.have.been.called;

            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action1InnerHandler).to.not.have.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then calls the handler defined in the inner component', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1InnerHandler).to.have.been.called;

            expect(this.action1OuterHandler).to.not.have.been.called;
            expect(this.action2Handler).to.not.have.been.called;
            expect(this.action3Handler).to.not.have.been.called;
          });
        });

      });
    });

    context('and both components have handlers defined', () => {
      beforeEach(function () {
        this.action1OuterActionOuterHandler = sinon.spy();
        this.action2OuterHandler = sinon.spy();
        this.action1InnerActionOuterHandler = sinon.spy();
        this.action3OuterHandler = sinon.spy();

        this.action1OuterActionInnerHandler = sinon.spy();
        this.action2InnerHandler = sinon.spy();
        this.action1InnerActionInnerHandler = sinon.spy();
        this.action3InnerHandler = sinon.spy();

        const outerHandlers = {
          'ACTION1_OUTER': this.action1OuterActionOuterHandler,
          'ACTION2_OUTER': this.action2OuterHandler,
          'ACTION1_INNER': this.action1InnerActionOuterHandler,
          'ACTION3_INNER': this.action3OuterHandler,
        };

        const innerHandlers = {
          'ACTION1_OUTER': this.action1OuterActionInnerHandler,
          'ACTION2_OUTER': this.action2InnerHandler,
          'ACTION1_INNER': this.action1InnerActionInnerHandler,
          'ACTION3_INNER': this.action3InnerHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} handlers={outerHandlers}>
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap} handlers={innerHandlers}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        context('when keys that an action defined only in the outer component are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action1OuterActionOuterHandler).to.have.not.been.called;
            expect(this.action2OuterHandler).to.have.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;
            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.not.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.not.been.called;
            expect(this.action3InnerHandler).to.have.not.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then does NOT call any handlers', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action1OuterActionOuterHandler).to.have.not.been.called;
            expect(this.action2OuterHandler).to.have.not.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;

            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.not.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.not.been.called;
            expect(this.action3InnerHandler).to.have.not.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then calls the handler defined in the outer component', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1OuterActionOuterHandler).to.have.been.called;
            expect(this.action2OuterHandler).to.have.not.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;
            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.not.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.not.been.called;
            expect(this.action3InnerHandler).to.have.not.been.called;
          });
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.innerChildElement');
          this.targetElement.focus();
        });

        context('when keys that match an action defined only in the outer component are pressed', () => {
          it('then calls the handler defined in the inner component', function() {
            this.targetElement.keyDown(KeyCode.B);

            expect(this.action1OuterActionOuterHandler).to.have.not.been.called;
            expect(this.action2OuterHandler).to.have.not.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;
            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.not.been.called;
            expect(this.action3InnerHandler).to.have.not.been.called;
          });
        });

        context('when keys that match an action defined only in the inner component are pressed', () => {
          it('then calls the handler defined in the inner component', function() {
            this.targetElement.keyDown(KeyCode.C);

            expect(this.action1OuterActionOuterHandler).to.have.not.been.called;
            expect(this.action2OuterHandler).to.have.not.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;
            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.not.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.not.been.called;
            expect(this.action3InnerHandler).to.have.been.called;
          });
        });

        context('when keys that match an action defined in both components are pressed', () => {
          it('then calls the handler defined in the inner component', function() {
            this.targetElement.keyDown(KeyCode.A);

            expect(this.action1OuterActionOuterHandler).to.have.not.been.called;
            expect(this.action2OuterHandler).to.have.not.been.called;
            expect(this.action1InnerActionOuterHandler).to.have.not.been.called;
            expect(this.action3OuterHandler).to.have.not.been.called;

            expect(this.action1OuterActionInnerHandler).to.have.not.been.called;
            expect(this.action2InnerHandler).to.have.not.been.called;
            expect(this.action1InnerActionInnerHandler).to.have.been.called;
            expect(this.action3InnerHandler).to.have.not.been.called;
          });
        });

      });

    });
  });

});
