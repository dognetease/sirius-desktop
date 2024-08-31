import React, { CSSProperties, ReactElement } from 'react';
import { WendangKey, WendangPdf, WendangMp4, WendangPpt, WendangQitawenjian, WendangWord, WendangXls, WendangTupian } from '@sirius/icons';

export function getIconByExt(ext: string, style: CSSProperties, size?: number): ReactElement {
  const fSize = { fontSize: size || 16, ...style };
  const iconComponent = getIconComponent(ext);
  return iconComponent ? (
    (React.cloneElement(iconComponent, { wrapClassName: 'materiel-icon', style: fSize }) as ReactElement)
  ) : (
    <WendangQitawenjian wrapClassName="materiel-icon" style={fSize} />
  );
}

function getIconComponent(ext: string): ReactElement | null {
  switch (ext) {
    case 'mp4':
      return <WendangMp4 />;
    case 'key':
      return <WendangKey />;
    case 'pdf':
      return <WendangPdf />;
    case 'ppt':
    case 'pptx':
      return <WendangPpt />;
    case 'doc':
    case 'docx':
      return <WendangWord />;
    case 'xls':
    case 'xlsx':
      return <WendangXls />;
    case 'png':
      return <WendangTupian />;
    case 'jpeg':
      return <WendangTupian />;
    case 'gif':
      return <WendangTupian />;
    case 'jpg':
      return <WendangTupian />;
    default:
      return null;
  }
}
