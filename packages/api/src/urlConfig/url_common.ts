import { config } from 'env_def';

const isWeb = config('build_for') === 'web';
export const host: string = isWeb ? '' : (config('host') as string);
