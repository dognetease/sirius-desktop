import React, { useState, useMemo, useCallback } from 'react';
import classnames from 'classnames/bind';
import createMentionPlugin, { MentionData, defaultSuggestionsFilter } from '@draft-js-plugins/mention';
import styles from './basicEditor.module.scss';

const realStyle = classnames.bind(styles);

interface MentionApi {
  scene: string;
  addPlugins(plugin: any): void;
}

export const Expression: React.FC<MentionApi> = props => {
  const { scene, addPlugins } = props;
  return null;
};
