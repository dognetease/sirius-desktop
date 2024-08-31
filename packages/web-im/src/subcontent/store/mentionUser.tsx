import React, { createContext, useState } from 'react';

interface MentionUserIdApi {
  mentionUserId: string;
  setMentionUserId: React.Dispatch<string>;
}

// 当前被引用人
export const MentionUserIdContext = createContext<MentionUserIdApi>({} as MentionUserIdApi);

export const MentionUserIdProvider: React.FC<any> = props => {
  const [mentionUserId, setMentionUserId] = useState<string>('');
  return (
    <MentionUserIdContext.Provider
      value={{
        mentionUserId,
        setMentionUserId,
      }}
    >
      {props.children}
    </MentionUserIdContext.Provider>
  );
};
