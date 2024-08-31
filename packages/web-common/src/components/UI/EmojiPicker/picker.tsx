import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface PickerProps {
  onEmojiSelect: (val: any) => void;
  previewEmoji?: 'point_up' | 'point_down';
  previewPosition?: 'top' | 'bottom' | 'none';
  searchPosition?: 'sticky' | 'static' | 'none';
  maxFrequentRows?: number;
  perLine?: number;
  visible?: boolean;
  locale?: 'en' | 'ar' | 'be' | 'cs' | 'de' | 'es' | 'fa' | 'fi' | 'fr' | 'hi' | 'it' | 'ja' | 'nl' | 'pl' | 'pt' | 'ru' | 'sa' | 'tr' | 'uk' | 'vi' | 'zh';
}
export const EmojiPicker: React.FC<PickerProps> = (props: PickerProps) => {
  const { onEmojiSelect, locale = 'zh', previewPosition = 'none', searchPosition = 'none', maxFrequentRows = 1, perLine = 7, visible = true } = props;

  if (!visible) {
    return <></>;
  }
  return (
    <Picker
      data={data}
      onEmojiSelect={onEmojiSelect}
      locale={locale}
      previewPosition={previewPosition}
      searchPosition={searchPosition}
      maxFrequentRows={maxFrequentRows}
      perLine={perLine}
    />
  );
};

export default EmojiPicker;
