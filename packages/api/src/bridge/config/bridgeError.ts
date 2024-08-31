// import { DispatchTaskRequestContent as TaskConfig } from '@/api/logical/bridge';
import { DispatchTaskRequestContent as TaskConfig } from '../interface/proxy';

type ErrorConfig = TaskConfig;

export class CustomError extends Error {
  code: number;

  duration: number[];

  config: ErrorConfig;

  constructor(message: string, options: { code: number; duration?: number[]; config: ErrorConfig }) {
    super(message);
    const { code, duration, config } = options;
    this.code = code;
    this.duration = Array.isArray(duration) && duration.length > 0 ? duration : [];
    this.config = config;
  }
}
