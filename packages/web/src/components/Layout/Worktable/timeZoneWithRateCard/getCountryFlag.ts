import GBPUrl from '@/images/flags/United_Kingdom.png';
import HKDUrl from '@/images/flags/Hong_Kong.png';
import USDUrl from '@/images/flags/United_States.png';
import CHFUrl from '@/images/flags/Switzerland.png';
import SGDUrl from '@/images/flags/Singapore.png';
import SEKUrl from '@/images/flags/Sweden.png';
import DKKUrl from '@/images/flags/Denmark.png';
import NOKUrl from '@/images/flags/Norway.png';
import JPYUrl from '@/images/flags/Japan.png';
import CADUrl from '@/images/flags/Canada.png';
import AUDUrl from '@/images/flags/Australia.png';
import EURUrl from '@/images/flags/EU.png';
import MOPUrl from '@/images/flags/Macao.png';
import PHPUrl from '@/images/flags/Philippines.png';
import THBUrl from '@/images/flags/Thailand.png';
import NZDUrl from '@/images/flags/New_Zealand.png';
import KRWUrl from '@/images/flags/K.O.Korea.png';
import RUBUrl from '@/images/flags/Russia.png';
import MYRUrl from '@/images/flags/Malaysia.png';
// import TWDUrl from '@/images/flags/Malaysia.png'
import INRUrl from '@/images/flags/India.png';
import IDRUrl from '@/images/flags/Indonesia.png';
import BRLUrl from '@/images/flags/Brazil.png';
import AEDUrl from '@/images/flags/United_Arab_Emirates.png';
import ZARUrl from '@/images/flags/South_Africa.png';
import SARUrl from '@/images/flags/Saudi_Arabia.png';
import TRYUrl from '@/images/flags/Turkey.png';

const CountryFlagMapping: Record<string, string> = {
  GBP: GBPUrl,
  HKD: HKDUrl,
  USD: USDUrl,
  CHF: CHFUrl,
  SGD: SGDUrl,
  SEK: SEKUrl,
  DKK: DKKUrl,
  NOK: NOKUrl,
  JPY: JPYUrl,
  CAD: CADUrl,
  AUD: AUDUrl,
  EUR: EURUrl,
  MOP: MOPUrl,
  PHP: PHPUrl,
  THB: THBUrl,
  NZD: NZDUrl,
  KRW: KRWUrl,
  RUB: RUBUrl,
  MYR: MYRUrl,
  // 'TWD': TWDUrl,
  INR: INRUrl,
  IDR: IDRUrl,
  BRL: BRLUrl,
  AED: AEDUrl,
  ZAR: ZARUrl,
  SAR: SARUrl,
  TRY: TRYUrl,
};

export const getCountryFlag = (currencyCode: string) => {
  if (!currencyCode || !CountryFlagMapping[currencyCode]) return '';

  return CountryFlagMapping[currencyCode];
};
