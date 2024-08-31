import { getIn18Text } from 'api';
const originData = [
  {
    name: getIn18Text('ZHONGGUODALU'),
    prefix: '86',
  },
  {
    name: getIn18Text('ZHONGGUOXIANGGANG'),
    prefix: '852',
  },
  {
    name: getIn18Text('ZHONGGUOAOMEN'),
    prefix: '853',
  },
  {
    name: getIn18Text('ZHONGGUOTAIWAN'),
    prefix: '886',
  },
  {
    name: 'Afghanistan',
    prefix: '93',
  },
  {
    name: 'Albania',
    prefix: '355',
  },
  {
    name: 'Algeria',
    prefix: '213',
  },
  {
    name: 'Andorra',
    prefix: '376',
  },
  {
    name: 'Angola',
    prefix: '244',
  },
  {
    name: 'Anguilla',
    prefix: '1264',
  },
  {
    name: 'Antigua and Barbuda',
    prefix: '1268',
  },
  {
    name: 'Argentina',
    prefix: '54',
  },
  {
    name: 'Armenia',
    prefix: '374',
  },
  {
    name: 'Aruba',
    prefix: '297',
  },
  {
    name: 'Australia',
    prefix: '61',
  },
  {
    name: 'Austria',
    prefix: '43',
  },
  {
    name: 'Azerbaijan',
    prefix: '994',
  },
  {
    name: 'Bahamas',
    prefix: '1242',
  },
  {
    name: 'Bahrain',
    prefix: '973',
  },
  {
    name: 'Bangladesh',
    prefix: '880',
  },
  {
    name: 'Barbados',
    prefix: '1246',
  },
  {
    name: 'Belarus',
    prefix: '375',
  },
  {
    name: 'Belgium',
    prefix: '32',
  },
  {
    name: 'Belize',
    prefix: '501',
  },
  {
    name: 'Benin',
    prefix: '229',
  },
  {
    name: 'Bermuda',
    prefix: '1441',
  },
  {
    name: 'Bhutan',
    prefix: '975',
  },
  {
    name: 'Bolivia',
    prefix: '591',
  },
  {
    name: 'Bosnia and Herzegovina',
    prefix: '387',
  },
  {
    name: 'Botswana',
    prefix: '267',
  },
  {
    name: 'Brazil',
    prefix: '55',
  },
  {
    name: 'Brunei',
    prefix: '673',
  },
  {
    name: 'Bulgaria',
    prefix: '359',
  },
  {
    name: 'Burkina Faso',
    prefix: '226',
  },
  {
    name: 'Burundi',
    prefix: '257',
  },
  {
    name: 'Cambodia',
    prefix: '855',
  },
  {
    name: 'Cameroon',
    prefix: '237',
  },
  {
    name: 'Canada',
    prefix: '1',
  },
  {
    name: 'Cape Verde',
    prefix: '238',
  },
  {
    name: 'Cayman Islands',
    prefix: '1345',
  },
  {
    name: 'Central African Republic',
    prefix: '236',
  },
  {
    name: 'Chad',
    prefix: '235',
  },
  {
    name: 'Chile',
    prefix: '56',
  },
  {
    name: 'Colombia',
    prefix: '57',
  },
  {
    name: 'Comoros',
    prefix: '269',
  },
  {
    name: 'Cook Islands',
    prefix: '682',
  },
  {
    name: 'Costa Rica',
    prefix: '506',
  },
  {
    name: 'Croatia',
    prefix: '385',
  },
  {
    name: 'Cuba',
    prefix: '53',
  },
  {
    name: 'Cyprus',
    prefix: '357',
  },
  {
    name: 'Czech Republic',
    prefix: '420',
  },
  {
    name: 'Democratic Republic of the Congo',
    prefix: '243',
  },
  {
    name: 'Denmark',
    prefix: '45',
  },
  {
    name: 'Djibouti',
    prefix: '253',
  },
  {
    name: 'Dominica',
    prefix: '1767',
  },
  {
    name: 'Dominican Republic',
    prefix: '1809',
  },
  {
    name: 'East Timor',
    prefix: '670',
  },
  {
    name: 'Ecuador',
    prefix: '593',
  },
  {
    name: 'Egypt',
    prefix: '20',
  },
  {
    name: 'El Salvador',
    prefix: '503',
  },
  {
    name: 'Equatorial Guinea',
    prefix: '240',
  },
  {
    name: 'Eritrea',
    prefix: '291',
  },
  {
    name: 'Estonia',
    prefix: '372',
  },
  {
    name: 'Ethiopia',
    prefix: '251',
  },
  {
    name: 'Faroe Islands',
    prefix: '298',
  },
  {
    name: 'Fiji',
    prefix: '679',
  },
  {
    name: 'Finland',
    prefix: '358',
  },
  {
    name: 'France',
    prefix: '33',
  },
  {
    name: 'French Guiana',
    prefix: '594',
  },
  {
    name: 'French Polynesia',
    prefix: '689',
  },
  {
    name: 'Gabon',
    prefix: '241',
  },
  {
    name: 'Gambia',
    prefix: '220',
  },
  {
    name: 'Georgia',
    prefix: '995',
  },
  {
    name: 'Germany',
    prefix: '49',
  },
  {
    name: 'Ghana',
    prefix: '233',
  },
  {
    name: 'Gibraltar',
    prefix: '350',
  },
  {
    name: 'Greece',
    prefix: '30',
  },
  {
    name: 'Greenland',
    prefix: '299',
  },
  {
    name: 'Grenada',
    prefix: '1473',
  },
  {
    name: 'Guadeloupe',
    prefix: '590',
  },
  {
    name: 'Guam',
    prefix: '1671',
  },
  {
    name: 'Guatemala',
    prefix: '502',
  },
  {
    name: 'Guinea',
    prefix: '224',
  },
  {
    name: 'Guinea-Bissau',
    prefix: '245',
  },
  {
    name: 'Guyana',
    prefix: '592',
  },
  {
    name: 'Haiti',
    prefix: '509',
  },
  {
    name: 'Honduras',
    prefix: '504',
  },
  {
    name: 'Hong Kong',
    prefix: '852',
  },
  {
    name: 'Hungary',
    prefix: '36',
  },
  {
    name: 'Iceland',
    prefix: '354',
  },
  {
    name: 'India',
    prefix: '91',
  },
  {
    name: 'Indonesia',
    prefix: '62',
  },
  {
    name: 'Iran',
    prefix: '98',
  },
  {
    name: 'Iraq',
    prefix: '964',
  },
  {
    name: 'Ireland',
    prefix: '353',
  },
  {
    name: 'Israel',
    prefix: '972',
  },
  {
    name: 'Italy',
    prefix: '39',
  },
  {
    name: 'Ivory Coast',
    prefix: '225',
  },
  {
    name: 'Jamaica',
    prefix: '1876',
  },
  {
    name: 'Japan',
    prefix: '81',
  },
  {
    name: 'Jersey',
    prefix: '44',
  },
  {
    name: 'Jordan',
    prefix: '962',
  },
  {
    name: 'Kazakhstan',
    prefix: '7',
  },
  {
    name: 'Kenya',
    prefix: '254',
  },
  {
    name: 'Kuwait',
    prefix: '965',
  },
  {
    name: 'Kyrgyzstan',
    prefix: '996',
  },
  {
    name: 'Laos',
    prefix: '856',
  },
  {
    name: 'Latvia',
    prefix: '371',
  },
  {
    name: 'Lebanon',
    prefix: '961',
  },
  {
    name: 'Lesotho',
    prefix: '266',
  },
  {
    name: 'Liberia',
    prefix: '231',
  },
  {
    name: 'Libya',
    prefix: '218',
  },
  {
    name: 'Liechtenstein',
    prefix: '423',
  },
  {
    name: 'Lithuania',
    prefix: '370',
  },
  {
    name: 'Luxembourg',
    prefix: '352',
  },
  {
    name: 'Macau',
    prefix: '853',
  },
  {
    name: 'Macedonia',
    prefix: '389',
  },
  {
    name: 'Madagascar',
    prefix: '261',
  },
  {
    name: 'Malawi',
    prefix: '265',
  },
  {
    name: 'Malaysia',
    prefix: '60',
  },
  {
    name: 'Maldives',
    prefix: '960',
  },
  {
    name: 'Mali',
    prefix: '223',
  },
  {
    name: 'Malta',
    prefix: '356',
  },
  {
    name: 'Martinique',
    prefix: '596',
  },
  {
    name: 'Mauritania',
    prefix: '222',
  },
  {
    name: 'Mauritius',
    prefix: '230',
  },
  {
    name: 'Mexico',
    prefix: '52',
  },
  {
    name: 'Moldova',
    prefix: '373',
  },
  {
    name: 'Monaco',
    prefix: '377',
  },
  {
    name: 'Mongolia',
    prefix: '976',
  },
  {
    name: 'Montenegro',
    prefix: '382',
  },
  {
    name: 'Montserrat',
    prefix: '1664',
  },
  {
    name: 'Morocco',
    prefix: '212',
  },
  {
    name: 'Mozambique',
    prefix: '258',
  },
  {
    name: 'Myanmar',
    prefix: '95',
  },
  {
    name: 'Namibia',
    prefix: '264',
  },
  {
    name: 'Nepal',
    prefix: '977',
  },
  {
    name: 'Netherlands',
    prefix: '31',
  },
  {
    name: 'Netherlands Antilles',
    prefix: '599',
  },
  {
    name: 'New Caledonia',
    prefix: '687',
  },
  {
    name: 'New Zealand',
    prefix: '64',
  },
  {
    name: 'Nicaragua',
    prefix: '505',
  },
  {
    name: 'Niger',
    prefix: '227',
  },
  {
    name: 'Nigeria',
    prefix: '234',
  },
  {
    name: 'North Korea',
    prefix: '850',
  },
  {
    name: 'Norway',
    prefix: '47',
  },
  {
    name: 'Oman',
    prefix: '968',
  },
  {
    name: 'Pakistan',
    prefix: '92',
  },
  {
    name: 'Palestinian Territory',
    prefix: '970',
  },
  {
    name: 'Panama',
    prefix: '507',
  },
  {
    name: 'Papua New Guinea',
    prefix: '675',
  },
  {
    name: 'Paraguay',
    prefix: '595',
  },
  {
    name: 'Peru',
    prefix: '51',
  },
  {
    name: 'Philippines',
    prefix: '63',
  },
  {
    name: 'Poland',
    prefix: '48',
  },
  {
    name: 'Portugal',
    prefix: '351',
  },
  {
    name: 'Puerto Rico',
    prefix: '1787',
  },
  {
    name: 'Qatar',
    prefix: '974',
  },
  {
    name: 'Republic Of The Congo',
    prefix: '242',
  },
  {
    name: 'Romania',
    prefix: '40',
  },
  {
    name: 'Russia',
    prefix: '7',
  },
  {
    name: 'Rwanda',
    prefix: '250',
  },
  {
    name: 'Reunion Island',
    prefix: '262',
  },
  {
    name: 'Saint Kitts and Nevis',
    prefix: '1869',
  },
  {
    name: 'Saint Lucia',
    prefix: '1758',
  },
  {
    name: 'Saint Pierre and Miquelon',
    prefix: '508',
  },
  {
    name: 'Saint Vincent and The Grenadines',
    prefix: '1784',
  },
  {
    name: 'Samoa',
    prefix: '685',
  },
  {
    name: 'San Marino',
    prefix: '378',
  },
  {
    name: 'Sao Tome and Principe',
    prefix: '239',
  },
  {
    name: 'Saudi Arabia',
    prefix: '966',
  },
  {
    name: 'Senegal',
    prefix: '221',
  },
  {
    name: 'Serbia',
    prefix: '381',
  },
  {
    name: 'Seychelles',
    prefix: '248',
  },
  {
    name: 'Sierra Leone',
    prefix: '232',
  },
  {
    name: 'Singapore',
    prefix: '65',
  },
  {
    name: 'Slovakia',
    prefix: '421',
  },
  {
    name: 'Slovenia',
    prefix: '386',
  },
  {
    name: 'Somalia',
    prefix: '252',
  },
  {
    name: 'South Africa',
    prefix: '27',
  },
  {
    name: 'South Korea',
    prefix: '82',
  },
  {
    name: 'South Sudan',
    prefix: '211',
  },
  {
    name: 'Spain',
    prefix: '34',
  },
  {
    name: 'Sri Lanka',
    prefix: '94',
  },
  {
    name: 'Sudan',
    prefix: '249',
  },
  {
    name: 'Suriname',
    prefix: '597',
  },
  {
    name: 'Swaziland',
    prefix: '268',
  },
  {
    name: 'Sweden',
    prefix: '46',
  },
  {
    name: 'Switzerland',
    prefix: '41',
  },
  {
    name: 'Syria',
    prefix: '963',
  },
  {
    name: 'Taiwan',
    prefix: '886',
  },
  {
    name: 'Tajikistan',
    prefix: '992',
  },
  {
    name: 'Tanzania',
    prefix: '255',
  },
  {
    name: 'Thailand',
    prefix: '66',
  },
  {
    name: 'Togo',
    prefix: '228',
  },
  {
    name: 'Tonga',
    prefix: '676',
  },
  {
    name: 'Trinidad and Tobago',
    prefix: '1868',
  },
  {
    name: 'Tunisia',
    prefix: '216',
  },
  {
    name: 'Turkey',
    prefix: '90',
  },
  {
    name: 'Turkmenistan',
    prefix: '993',
  },
  {
    name: 'Turks and Caicos Islands',
    prefix: '1649',
  },
  {
    name: 'Uganda',
    prefix: '256',
  },
  {
    name: 'Ukraine',
    prefix: '380',
  },
  {
    name: 'United Arab Emirates',
    prefix: '971',
  },
  {
    name: 'United Kingdom',
    prefix: '44',
  },
  {
    name: 'United States',
    prefix: '1',
  },
  {
    name: 'Uruguay',
    prefix: '598',
  },
  {
    name: 'Uzbekistan',
    prefix: '998',
  },
  {
    name: 'Vanuatu',
    prefix: '678',
  },
  {
    name: 'Venezuela',
    prefix: '58',
  },
  {
    name: 'Vietnam',
    prefix: '84',
  },
  {
    name: 'Virgin Islands British',
    prefix: '1340',
  },
  {
    name: 'Yemen',
    prefix: '967',
  },
  {
    name: 'Zambia',
    prefix: '260',
  },
  {
    name: 'Zimbabwe',
    prefix: '263',
  },
];
export interface Area {
  name: string;
  prefix: string;
}
interface GroupArea {
  title: string;
  children: Area[];
}
const orderArea = () => {
  const result: any[] = [];
  const labelMap = new Map<string, Area[]>();
  originData.forEach(item => {
    if (/[\u4e00-\u9fa5]/.test(item.name)) {
      result.push(item);
    } else {
      const label = item.name.charAt(0).toUpperCase();
      const area = labelMap.get(label) || [];
      area.push(item);
      labelMap.set(label, area);
    }
  });
  labelMap.forEach((value, title) => {
    result.push({
      title,
      children: value,
    });
  });
  return result as Array<GroupArea & Area>;
};
export default orderArea();
