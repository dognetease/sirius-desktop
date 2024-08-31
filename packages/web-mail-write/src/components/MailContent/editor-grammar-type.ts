export interface RecombineDataType {
  startPos: number;
  textStartPos: number;
  correctChunk: string;
  orgChunk: string;
  detailReason: string;
}

export interface GrammarResult {
  RequestId: string;
  errorCode: string;
  Result: Result;
}

export interface Result {
  rawEssay: string;
  sentNum: number;
  uniqueKey: string;
  essayAdvice: string;
  title: string;
  totalScore: number;
  writeType: number;
  essayLangName: string;
  majorScore: MajorScore;
  allFeatureScore: AllFeatureScore;
  paraNum: number;
  essayFeedback: EssayFeedback;
  wordNum: number;
  fullScore: number;
  totalEvaluation: string;
  stLevel: string;
  conjWordNum: number;
  writeModel: number;
}

interface EssayFeedback {
  sentsFeedback: SentsFeedback[];
}

interface SentsFeedback {
  rawSent: string;
  paraId: number;
  sentId: number;
  errorPosInfos: (ErrorPosInfo | ErrorPosInfos2 | ErrorPosInfos3)[];
  sentFeedback: string;
  sentStartPos: number;
  correctedSent: string;
  rawSegSent: string;
  isContainGrammarError: boolean;
  isContainTypoError: boolean;
  sentScore: number;
  isValidLangSent: boolean;
  synInfo?: SynInfo[];
}

interface SynInfo {
  source: Source[];
  synId: number;
  synType: string;
  target: Target[][];
}

interface Target {
  word: string;
  tran: string;
  startPos: number;
  endPos: number;
  stuLevel: number[];
}

interface Source {
  word: string;
  startPos: number;
  endPos: number;
  stuLevel: number[];
}

interface ErrorPosInfos3 {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  errorTypeCode: string;
  errorTypeId: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ErrorPosInfos2 {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  rvalidChunk: string;
  errorTypeCode: string;
  errorTypeId: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ErrorPosInfo {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  errorTypeCode: string;
  errorTypeId: string;
  cvalidChunk: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ExampleCase {
  right: string;
  error: string;
}

interface AllFeatureScore {
  neuralScore: number;
  grammar: number;
  conjunction: number;
  spelling: number;
  advanceVocab: number;
  wordNum: number;
  topic: number;
  lexicalSubs: number;
  wordDiversity: number;
  sentComplex: number;
  structure: number;
}

interface MajorScore {
  grammarAdvice: string;
  wordScore: number;
  grammarScore: number;
  topicScore: number;
  wordAdvice: string;
  structureScore: number;
  structureAdvice: string;
}
