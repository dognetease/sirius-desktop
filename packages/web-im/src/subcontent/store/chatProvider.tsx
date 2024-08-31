import React, { useEffect } from 'react';
import { Provider as CurrentIdClientProvider } from './currentIdClientProvider';
import { P2PSessionProvider, TeamSessionProvider } from './currentSessioProvider';
import { DestoryTeamSessionProvider } from './destroyChatProvider';
import { Provider as DrawedMsgProvider } from './drawmsgProvider';
import { Provider as MaxSizeProvider } from './maxsizeProvider';
import { Provider as MemberProvider } from './memberProvider';
import { MentionUserIdProvider } from './mentionUser';
import { Provider as MessageProvider } from './messageProvider';
import { P2PMsgReceipt, TeamMsgReceipt } from './msgReceipts';
import { PasteFileProvider } from './pasteFile';
import { CommentsProvider } from './quickCommentsList';
import { ReadProvider } from './readCountStore';
import { ReplyMsgProvider } from './replingMsg';
import { Provider as TreadProvider } from './replyMsgProvider';
import { Provider as TeamsettingvisibleProvider } from './teamsettingVisibleProvider';
import { Provider as TreadDrawerVisibleProvider } from './treadDrawerVisbleProvider';

interface ChatUserlistApi {
  to: string;
  children: React.ReactNode;
}
// 当前会话的信息
export { CurSessionContext } from './currentSessioProvider';

interface CollectionComposeApi {
  providers: React.ReactNode[];
  children: React.ReactNode;
}
// @ts-ignore
export const CollectionCompose: React.PropsWithChildren<CollectionComposeApi> = props => {
  const { providers, children, ...restProps } = props;
  return props.providers.reduceRight((children, Parent) => <Parent {...restProps}>{children}</Parent>, props.children);
};

type CollectionInfoApi = ChatUserlistApi;

export const P2PCollectionInfo: React.FC<CollectionInfoApi> = props => {
  const { children, ...restProps } = props;

  return (
    // @ts-ignore
    <CollectionCompose
      providers={[
        P2PSessionProvider,
        P2PMsgReceipt,
        ReplyMsgProvider,
        PasteFileProvider,
        CommentsProvider,
        MessageProvider,
        TreadProvider,
        DrawedMsgProvider,
        CurrentIdClientProvider,
        MaxSizeProvider,
        TreadDrawerVisibleProvider,
        MentionUserIdProvider,
      ]}
      {...restProps}
    >
      {props.children}
    </CollectionCompose>
  );
};

export const TeamCollectionInfo: React.FC<CollectionInfoApi> = props => {
  const { children, ...restProps } = props;
  return (
    <CollectionCompose
      providers={[
        TeamSessionProvider,
        ReadProvider,
        TeamMsgReceipt,
        ReplyMsgProvider,
        PasteFileProvider,
        DestoryTeamSessionProvider,
        CommentsProvider,
        MessageProvider,
        MemberProvider,
        TreadProvider,
        DrawedMsgProvider,
        CurrentIdClientProvider,
        MaxSizeProvider,
        TeamsettingvisibleProvider,
        TreadDrawerVisibleProvider,
        MentionUserIdProvider,
      ]}
      {...restProps}
    >
      {props.children}
    </CollectionCompose>
  );
};
