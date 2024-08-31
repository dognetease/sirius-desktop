export interface regRuleConfig {
  scheme: string;
  ruleName: string;
  place?: 'start' | 'end' | 'normal';

  rule(url: string): string;
}

export interface callRuleConfig {
  scheme: string;
  url: string;
}

export interface MyRule {
  [scheme: string]: Array<regRuleConfig>;
}
