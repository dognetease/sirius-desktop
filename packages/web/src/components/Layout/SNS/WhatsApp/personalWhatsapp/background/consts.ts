import { config } from 'env_def';

const isWeb = config('build_for') === 'web';
export const BASE_URL = isWeb ? '' : (config('host') as string);
