import React, { useState, useEffect } from 'react';
import { Form, Radio, Input, Checkbox, Upload, message } from 'antd';
import { navigate } from '@reach/router';
import pinyin from 'tiny-pinyin';
import { useSessionStorage } from 'react-use';
import type { RcFile } from 'antd/es/upload/interface';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import { nanoid } from '@web-entry-wm/layouts/utils/nanoId';
import style from './style.module.scss';
import styles from '../myDomain/style.module.scss';
import { api, apis, getIn18Text, SiteApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Agreement } from '../../components/Agreement';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as InfoIcon } from '../../images/info.svg';
import { ReactComponent as LoadingIcon } from '../../images/loading-small.svg';
import { ReactComponent as ReplaceIcon } from '../../images/replace-icon.svg';
import Uploaded from '../../images/info-temp-placeholder.png';
// import ExamE from '../../images/exam-E.png';
// import ExamI from '../../images/exam-I.png';
import { countryMap } from './country.js';
import { proList } from './city.js';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const { Item } = Form;
const { Dragger } = Upload;
const countryList = Object.entries(countryMap).map(([key, val]) => {
  return { value: key, label: val.l };
});

function toPinyin(str: string) {
  try {
    const val = str.replaceAll(/[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/g, '');
    return pinyin.convertToPinyin(val, ' ', true);
  } catch (e) {
    console.warn(e);
    return str;
  }
}

const telReg = /^0\d{2,3}-\d{7,8}$/;
const phoneReg = /^1([0-9]{10})$/;
const emailReg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/;

export interface IDType {
  code: string;
  description: string;
  type: string;
}

interface PageQueryString {
  templateId: string;
}

interface CreateInfoTemplateProps {
  qs: PageQueryString; // url 参数
}

export const CreateInfoTemplate = (props: CreateInfoTemplateProps) => {
  const { templateId: tid } = props.qs;
  const [defaultData, setDefaultData] = useSessionStorage('info-template-draft');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [getLoading, setGetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [cityList, setCityList] = useState<any[]>([]);
  const [EIDTypeList, setEIDTypeList] = useState<any[]>([]);
  const [IIDTypeList, setIIDTypeList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [checked, setChecked] = useState(false);

  const [addressEnglish, setCAdr] = useState('');
  const [address, setCAdrM] = useState('');
  const [countryCode, setCCo] = useState('CN');
  const [provinceEnglish, setCSt] = useState('');
  const [province, setCStM] = useState('');
  const [cityEnglish, setCCt] = useState('');
  const [city, setCCtM] = useState('');
  const [email, setCCEm] = useState('');
  const [firstNameEnglish, setCFn] = useState('');
  const [firstName, setCFnM] = useState('');
  const [idCode, setCIdnumGswl] = useState('');
  const [idTypeGswl, setCIdtypeGswl] = useState('');
  const [lastNameEnglish, setCLn] = useState('');
  const [lastName, setCLnM] = useState('');
  const [postalCode, setCPc] = useState('');
  const [phoneType, setCPhType] = useState('');
  const [regType, setCRegtype] = useState('I');
  const [countryTelCode, setCocode] = useState(countryMap['CN'].p);
  const [wcfCode, setWcfCode] = useState('');
  const [orgNameEnglish, setCOrg] = useState('');
  const [orgName, setCOrgM] = useState('');
  const [cellphone, setCPh] = useState('');
  const [telephoneCode, setCPhCode] = useState('');
  const [telephoneExt, setCPhFj] = useState('');
  const [telephone, setCPhNum] = useState('');
  const [templateId, setSysId] = useState('');
  const [fullName, setFullName] = useState('');
  const [fullNameEnglish, setFullNameEnglish] = useState('');
  const [phNum, setPhNum] = useState('');

  const [phNumError, setPhNumError] = useState('');
  const [emError, setEmError] = useState('');
  const [idChanged, setIdChanged] = useState(false);
  const [lNError, setLNError] = useState('');
  const [lNEError, setLNEError] = useState('');
  const [fNError, setFNError] = useState('');
  const [fNEError, setFNEError] = useState('');
  const [oNError, setONError] = useState('');
  const [oNEError, setONEError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [fullNameEError, setFullNameEError] = useState('');
  const [ctError, setCtError] = useState('');
  const [adrError, setAdrError] = useState('');
  const [adrEError, setAdrEError] = useState('');
  const [pcError, setPCError] = useState('');
  const [iTError, setITError] = useState('');
  const [iCError, setICError] = useState('');
  const [wcfError, setWcfError] = useState('');
  const [fjError, setFJError] = useState('');
  const openHelpCenter = useOpenHelpCenter();

  const dataRef = React.useRef<any>({
    countryCode: 'CN',
    countryTelCode: countryMap['CN'].p,
    regType: 'I',
  });

  const setTempData = (res: any) => {
    const {
      address,
      addressEnglish,
      countryCode,
      city,
      cityEnglish,
      email,
      idCode,
      idTypeGswl,
      regType,
      postalCode,
      province,
      provinceEnglish,
      cellphone,
      telephoneCode,
      telephoneExt,
      telephone,
      orgName,
      orgNameEnglish,
      firstName,
      firstNameEnglish,
      lastName,
      lastNameEnglish,
      fullName,
      fullNameEnglish,
    } = res;
    setCAdr(addressEnglish ?? '');
    setCAdrM(address ?? '');
    setCCo(countryCode ?? '');
    setCCtM(city ?? '');
    setCCt(cityEnglish ?? '');
    setCCEm(email ?? '');
    setCIdnumGswl(idCode ?? '');
    setCIdtypeGswl(idTypeGswl ?? '');
    setCPhType(cellphone ? '0' : '1');
    setCRegtype(regType ?? '');
    setCPc(postalCode ?? '');
    setCStM(province ?? '');
    setCSt(provinceEnglish ?? '');
    setCocode((countryMap as any)[countryCode].p ?? '');
    setCPh(cellphone ?? '');
    setCPhNum(telephone ?? '');
    setCPhCode(telephoneCode ?? '');
    setCPhFj(telephoneExt ?? '');
    setCOrg(orgNameEnglish ?? '');
    setCOrgM(orgName ?? '');
    setCFn(firstNameEnglish ?? '');
    setCFnM(firstName ?? '');
    setCLn(lastNameEnglish ?? '');
    setCLnM(lastName ?? '');
    setFullName(fullName ?? '');
    setFullNameEnglish(fullNameEnglish ?? '');
    setPhNum(cellphone ? cellphone : telephoneCode ? `${telephoneCode}-${telephone}` : '');
  };

  const saveData = () => {
    if (tid) return;
    setDefaultData(JSON.stringify(dataRef.current));
  };

  useEffect(() => {
    if (tid) {
      setSysId(tid);
      getTemplateData();
    } else if (defaultData) {
      const curData = JSON.parse(defaultData as string);
      dataRef.current = curData;
      setTempData(curData);
    }
    getIDTypeList();
  }, []);

  const getIDTypeList = async () => {
    try {
      const list = await siteApi.listIDType({});
      const EList: any[] = [];
      const IList: any[] = [];
      list.forEach((item: IDType) => {
        const res = { value: item.code, label: item.description };
        if (item.type === 'E') EList.push(res);
        if (item.type === 'I') IList.push(res);
      });
      setEIDTypeList(EList);
      setIIDTypeList(IList);
      if (!tid && !dataRef.current.idTypeGswl) {
        setCIdtypeGswl(regType === 'I' ? IList[0].value : EList[0].value);
        dataRef.current.idTypeGswl = regType === 'I' ? IList[0].value : EList[0].value;
      }
    } catch {}
  };

  const getTemplateData = async () => {
    setGetLoading(true);
    try {
      const res = await siteApi.getDomainTemplate({ templateId: tid });
      const { status } = res;
      if (status === 2 || status === 4) {
        goInfoTemplate();
        return;
      }
      setTempData(res);
      setChecked(true);
    } finally {
      setGetLoading(false);
    }
  };

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const goInfoTemplate = () => {
    navigate('#site?page=infoTemplate');
  };

  const handleCountryChange = (val: any) => {
    setCCo(val);
    setCocode((countryMap as any)[val].p);
    setCStM('');
    setCCtM('');
    setCSt('');
    setCCt('');
    setCtError('');
    dataRef.current.countryCode = val;
    dataRef.current.countryTelCode = (countryMap as any)[val].p;
    dataRef.current.province = '';
    dataRef.current.city = '';
    dataRef.current.provinceEnglish = '';
    dataRef.current.cityEnglish = '';
    if (val !== 'CN') {
      const v = (countryMap as any)[val].l;
      setCStM(v);
      setCCtM(v);
      setCSt(toPinyin(v));
      setCCt(toPinyin(v));
      dataRef.current.province = v;
      dataRef.current.city = v;
      dataRef.current.provinceEnglish = toPinyin(v);
      dataRef.current.cityEnglish = toPinyin(v);
    }
    saveData();
  };

  const handleProvinceChange = (val: any) => {
    const target = proList.find(i => i.value === val);
    if (target?.children) setCityList(target.children);
    setCStM(val);
    setCSt(toPinyin(val));
    setCCtM('');
    setCCt('');
    setCtError('');
    dataRef.current.province = val;
    dataRef.current.city = '';
    dataRef.current.provinceEnglish = toPinyin(val);
    dataRef.current.cityEnglish = '';
    saveData();
  };

  const handleCityChange = (val: any) => {
    setCCtM(val);
    setCCt(toPinyin(val));
    setCtError('');
    dataRef.current.city = val;
    dataRef.current.cityEnglish = toPinyin(val);
    saveData();
  };

  const handleRegTypeChange = (e: any) => {
    setCRegtype(e.target.value);
    setCLnM('');
    setCLn('');
    setCFnM('');
    setCFn('');
    setFullName('');
    setFullNameEnglish('');
    setCOrgM('');
    setCOrg('');
    setCIdnumGswl('');
    setCStM('');
    setCCtM('');
    setCSt('');
    setCCt('');
    setCAdrM('');
    setCAdr('');
    setWcfCode('');
    setCPc('');
    setCCEm('');
    setCPhFj('');
    setCPhType('');
    setCPh('');
    setCPhCode('');
    setCPhNum('');
    setPhNum('');
    setCCo('CN');
    setCocode(countryMap['CN'].p);
    setCIdtypeGswl(e.target.value === 'I' ? IIDTypeList[0].value : EIDTypeList[0].value);

    setCtError('');
    setImageUrl('');
    setFNError('');
    setLNError('');
    setFNEError('');
    setLNError('');
    setONError('');
    setONEError('');
    setFullNameError('');
    setFullNameEError('');
    setITError('');
    setICError('');

    dataRef.current = {
      countryCode: 'CN',
      countryTelCode: countryMap['CN'].p,
      regType: e.target.value,
      idTypeGswl: e.target.value === 'I' ? IIDTypeList[0].value : EIDTypeList[0].value,
    };
    saveData();
  };

  const handleFnMChange = (e: any) => {
    setCFnM(e.target.value);
    setCFn(toPinyin(e.target.value));
    setFullName('');
    setFullNameEnglish('');
    setFNError('');
    setFNEError('');
    dataRef.current.firstName = e.target.value;
    dataRef.current.firstNameEnglish = toPinyin(e.target.value);
    dataRef.current.fullName = '';
    dataRef.current.fullNameEnglish = '';
    saveData();
  };

  const handleLnMChange = (e: any) => {
    setCLnM(e.target.value);
    setCLn(toPinyin(e.target.value));
    setFullName('');
    setFullNameEnglish('');
    setLNError('');
    setLNEError('');
    dataRef.current.lastName = e.target.value;
    dataRef.current.lastNameEnglish = toPinyin(e.target.value);
    dataRef.current.fullName = '';
    dataRef.current.fullNameEnglish = '';
    saveData();
  };

  const handleAdrMChange = (e: any) => {
    setCAdrM(e.target.value);
    setCAdr(toPinyin(e.target.value));
    setAdrError('');
    setAdrEError('');
    dataRef.current.address = e.target.value;
    dataRef.current.addressEnglish = toPinyin(e.target.value);
    saveData();
  };

  const handlePcChange = (e: any) => {
    setCPc(e.target.value);
    setPCError('');
    dataRef.current.postalCode = e.target.value;
    saveData();
  };

  const handleEmChange = (e: any) => {
    setEmError('');
    setCCEm(e.target.value);
    dataRef.current.email = e.target.value;
    saveData();
  };

  const handleFnChange = (e: any) => {
    setCFn(e.target.value);
    setFullNameEnglish('');
    setFNEError('');
    dataRef.current.firstNameEnglish = e.target.value;
    dataRef.current.fullNameEnglish = '';
    saveData();
  };

  const handleLnChange = (e: any) => {
    setCLn(e.target.value);
    setFullNameEnglish('');
    setLNEError('');
    dataRef.current.lastNameEnglish = e.target.value;
    dataRef.current.fullNameEnglish = '';
    saveData();
  };

  const handleAdrChange = (e: any) => {
    setCAdr(e.target.value);
    setAdrEError('');
    dataRef.current.addressEnglish = e.target.value;
    saveData();
  };

  const handleIdnumChange = (e: any) => {
    setIdChanged(true);
    setCIdnumGswl(e.target.value);
    setICError('');
    dataRef.current.idCode = e.target.value;
    saveData();
  };

  const handleOrgMChange = (e: any) => {
    setCOrgM(e.target.value);
    setCOrg(toPinyin(e.target.value));
    setONError('');
    setONEError('');
    dataRef.current.orgName = e.target.value;
    dataRef.current.orgNameEnglish = toPinyin(e.target.value);
    saveData();
  };

  const handleFullnameChange = (e: any) => {
    setFullName(e.target.value);
    setFullNameEnglish(toPinyin(e.target.value));
    setFullNameError('');
    setFullNameEError('');
    dataRef.current.fullName = e.target.value;
    dataRef.current.fullNameEnglish = toPinyin(e.target.value);
    saveData();
  };

  const handleFullnameEChange = (e: any) => {
    setFullNameEnglish(e.target.value);
    setFullNameEError('');
    dataRef.current.fullNameEnglish = e.target.value;
    saveData();
  };

  const handleOrgChange = (e: any) => {
    setCOrg(e.target.value);
    setONEError('');
    dataRef.current.orgNameEnglish = e.target.value;
    saveData();
  };

  const handleIdTypeChange = (val: any) => {
    setCIdtypeGswl(val);
    setITError('');
    dataRef.current.idTypeGswl = val;
    saveData();
  };

  const handlePhFjChange = (e: any) => {
    setFJError('');
    setCPhFj(e.target.value);
    dataRef.current.telephoneExt = e.target.value;
    saveData();
  };

  const handlePhNumChange = (e: any) => {
    setPhNumError('');
    setPhNum(e.target.value);
    dataRef.current.phNum = e.target.value;
    saveData();
  };

  const checkPC = () => {
    if (!/^[0-9]{5,8}$/.test(postalCode)) {
      setPCError('请输入正确的邮编');
    }
  };

  const checkFJ = () => {
    if (telephoneExt && !/^[0-9]+$/.test(telephoneExt)) {
      setFJError('请输入正确的分机号');
    }
  };

  const checkPhNum = () => {
    if (countryCode === 'CN') {
      if (telReg.test(phNum)) {
        setCPhType('1');
        setCPhCode(phNum.split('-')[0]);
        setCPhNum(phNum.split('-')[1]);
        dataRef.current.phoneType = '1';
        dataRef.current.telephoneCode = phNum.split('-')[0];
        dataRef.current.telephone = phNum.split('-')[1];
      } else if (phoneReg.test(phNum)) {
        setCPhType('0');
        setCPh(phNum);
        dataRef.current.phoneType = '0';
        dataRef.current.cellphone = phNum;
      } else {
        setPhNumError('请输入正确的联系电话');
        return false;
      }
    } else {
      if (/^[0-9]*$/.test(phNum)) {
        setCPhType('0');
        setCPh(phNum);
        dataRef.current.phoneType = '0';
        dataRef.current.cellphone = phNum;
      } else {
        setPhNumError('请输入正确的联系电话');
        return false;
      }
    }
    return true;
  };

  const checkEmail = () => {
    if (!emailReg.test(email)) setEmError('请输入正确的电子邮箱');
  };

  const onCheckedChange = (e: any) => {
    setChecked(e.target.checked);
  };

  const submitHandler = async () => {
    if (submitLoading) return;
    setChecked(true);
    setSubmitLoading(true);
    hideConfirmModal();
    const data: any = {
      address,
      addressEnglish,
      countryCode,
      city,
      cityEnglish,
      email,
      idCode,
      idTypeGswl,
      phoneType,
      regType,
      postalCode,
      province,
      provinceEnglish,
      countryTelCode,
      wcfCode,
      cellphone,
      telephoneCode,
      telephoneExt,
      telephone,
      orgName,
      orgNameEnglish,
      firstName,
      firstNameEnglish,
      lastName,
      lastNameEnglish,
      fullName: fullName || lastName + firstName,
      fullNameEnglish: fullNameEnglish || lastNameEnglish + firstNameEnglish,
    };
    try {
      if (templateId) {
        data.templateId = templateId;
        if (!wcfCode) delete data.wcfCode;
        if (!idChanged) delete data.idCode;
        await siteApi.modifyDomainTemplate(data);
      } else {
        await siteApi.createDomainTemplate(data);
        setDefaultData('');
      }
      goInfoTemplate();
    } catch (e: any) {
      message.error('信息错误');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showConfirmModal = () => {
    setShowModal(true);
  };

  const hideConfirmModal = () => {
    setShowModal(false);
  };

  const submit = () => {
    if (!checkForm()) return;
    if (!btnAble()) return;
    if (!checked) {
      showConfirmModal();
    } else {
      submitHandler();
    }
  };

  const getBase64 = (img: RcFile): Promise<string> => {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => res(reader.result as string));
      reader.readAsDataURL(img);
    });
  };

  const beforeUpload = (file: RcFile) => {
    if (loading) return;
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/bmp';
    const isLt5M = file.size / 1024 / 1024 < 5 && file.size / 1024 > 55;
    if (!isJpgOrPng || !isLt5M) {
      setShowUploadModal(true);
      return false;
    }
    setLoading(true);
    const tempId = nanoid();
    Promise.all([getBase64(file), uploadFile(file, tempId)])
      .then(([url, _]) => {
        setWcfError('');
        setWcfCode(tempId);
        setImageUrl(url);
      })
      .catch(() => setImageUrl(''))
      .finally(() => setLoading(false));
    return isJpgOrPng && isLt5M;
  };

  const customRequest = () => {};

  const uploadFile = (file: RcFile, wcfCode: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return siteApi.uploadWCF({ file: formData, wcfCode });
  };

  const btnAble = () => {
    let res = Boolean(
      address &&
        addressEnglish &&
        countryCode &&
        province &&
        provinceEnglish &&
        city &&
        cityEnglish &&
        email &&
        postalCode &&
        idCode &&
        idTypeGswl &&
        regType &&
        phoneType &&
        countryTelCode &&
        (cellphone || telephone) &&
        !emError &&
        !phNumError
    );
    if (!tid) res = res && Boolean(wcfCode);
    if (regType === 'I') return res && Boolean(lastName && lastNameEnglish && firstName && firstNameEnglish);
    return res && Boolean(fullName && orgName && orgNameEnglish);
  };

  const checkForm = () => {
    if (regType === 'I') {
      if (!lastName) setLNError('请输入域名持有者姓名(姓)');
      if (!firstName) setFNError('请输入域名持有者姓名(名)');
      if (!lastNameEnglish) setLNEError('请输入域名持有者姓名(姓)');
      if (!firstNameEnglish) setFNEError('请输入域名持有者姓名(名)');
    }
    if (regType === 'E') {
      if (!orgName) setONError('请输入所有者单位名称');
      if (!fullName) setFullNameError('请输入单位联系人姓名');
      if (!orgNameEnglish) setONEError('请输入所有者单位名称');
      if (!fullNameEnglish) setFullNameEError('请输入单位联系人姓名');
    }
    if (countryCode === 'CN') {
      if (!province || !city) setCtError('请选择所属区域');
    }
    if (!address) setAdrError('请输入通讯地址');
    if (!postalCode) setPCError('请输入邮编');
    if (!addressEnglish) setAdrEError('请输入通讯地址(英文)');
    if (!idTypeGswl) setITError('请选择证件类型');
    if (!idCode) setICError('请输入证件号码');

    if (!tid && !wcfCode) setWcfError('请提交证件照正面');
    checkEmail();
    return checkPhNum();
  };

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
    openHelpCenter('/d/1649407615124459521.html');
  };

  return (
    <>
      {getLoading ? (
        <div className={style.pageLoading}>loading...</div>
      ) : (
        <div className={style.createInfoTemplate}>
          <div className={style.container}>
            <div className={style.createInfoTemplateHeader}>
              <Breadcrumb>
                <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
                <Breadcrumb.Item>信息模板</Breadcrumb.Item>
              </Breadcrumb>
              <div className={style.headerRight}>
                <QuestionIcon />
                <span>域名管理常见问题</span>
                <div onClick={goHelpCenter}>点击了解</div>
              </div>
            </div>
            <Form colon={false}>
              <div className={style.createInfoTemplateContent}>
                <div className={style.title}>中文信息模板</div>
                <Item label="域名持有者类型">
                  <Radio.Group value={regType} onChange={handleRegTypeChange}>
                    <Radio value="I">个人</Radio>
                    <Radio value="E">企业/组织</Radio>
                  </Radio.Group>
                </Item>
                {regType === 'I' && (
                  <>
                    <Item label="域名持有者姓名(姓)">
                      <Input
                        value={lastName}
                        style={{ width: '286px' }}
                        maxLength={16}
                        onChange={handleLnMChange}
                        className={lNError ? style.inputError : ''}
                        suffix={<div>{lastName.length}/16</div>}
                        placeholder="请输入内容"
                      />
                      <div className={style.formItemInfo}>
                        域名持有者名称代表域名的拥有权，请填写与所有者证件完全一致的企业名称或姓名；若该域名需备案，请确保域名持有者名称与备案主体名称一致，并完成域名实名认证。
                      </div>
                      {lNError && <div className={style.formItemError}>{lNError}</div>}
                    </Item>
                    <Item label="域名持有者姓名(名)">
                      <Input
                        value={firstName}
                        style={{ width: '286px' }}
                        maxLength={16}
                        onChange={handleFnMChange}
                        className={fNError ? style.inputError : ''}
                        suffix={<div>{firstName.length}/16</div>}
                        placeholder="请输入内容"
                      />
                      <div className={style.formItemInfo}>
                        域名持有者名称代表域名的拥有权，请填写与所有者证件完全一致的企业名称或姓名；若该域名需备案，请确保域名持有者名称与备案主体名称一致，并完成域名实名认证。
                      </div>
                      {fNError && <div className={style.formItemError}>{fNError}</div>}
                    </Item>
                  </>
                )}
                {regType === 'E' && (
                  <>
                    <Item label="所有者单位名称">
                      <Input
                        value={orgName}
                        style={{ width: '520px' }}
                        maxLength={100}
                        onChange={handleOrgMChange}
                        className={oNError ? style.inputError : ''}
                        suffix={<div>{orgName.length}/100</div>}
                        placeholder="请输入内容"
                      />
                      {oNError && <div className={style.formItemError}>{oNError}</div>}
                    </Item>
                    <Item label="单位联系人姓名">
                      <Input
                        value={fullName}
                        style={{ width: '520px' }}
                        maxLength={16}
                        onChange={handleFullnameChange}
                        className={fullNameError ? style.inputError : ''}
                        suffix={<div>{fullName.length}/16</div>}
                        placeholder="请输入内容"
                      />
                      {fullNameError && <div className={style.formItemError}>{fullNameError}</div>}
                    </Item>
                  </>
                )}
                <Item label="所属区域">
                  <Select value={countryCode} style={{ width: '160px' }} onChange={handleCountryChange} options={countryList} placeholder="请选择国家" />
                  {countryCode === 'CN' && (
                    <Select
                      value={province === '' ? undefined : province}
                      style={{ width: '160px', marginLeft: '20px' }}
                      onChange={handleProvinceChange}
                      options={proList}
                      placeholder="请选择省份"
                    />
                  )}
                  {countryCode === 'CN' && (
                    <Select
                      value={city === '' ? undefined : city}
                      style={{ width: '160px', marginLeft: '20px' }}
                      onChange={handleCityChange}
                      options={cityList}
                      placeholder="请选择城市"
                    />
                  )}
                  {ctError && <div className={style.formItemError}>{ctError}</div>}
                </Item>
                <Item label="通讯地址">
                  <Input
                    value={address}
                    maxLength={64}
                    style={{ maxWidth: '520px' }}
                    placeholder="请输入通讯地址"
                    suffix={<div>{address.length}/64</div>}
                    className={adrError ? style.inputError : ''}
                    onChange={handleAdrMChange}
                  />
                  {adrError && <div className={style.formItemError}>{adrError}</div>}
                </Item>
                <Item label="邮编">
                  <Input
                    value={postalCode}
                    maxLength={8}
                    style={{ width: '160px' }}
                    placeholder="请输入邮编"
                    className={pcError ? style.inputError : ''}
                    onChange={handlePcChange}
                    onBlur={checkPC}
                  />
                  {pcError && <div className={style.formItemError}>{pcError}</div>}
                </Item>
                <Item label="联系电话">
                  <div className={style.phoneLine}>
                    <div className={style.cocode}>
                      {countryTelCode}
                      <span />
                    </div>
                    <Input
                      value={phNum}
                      placeholder="手机号/区号+固定电话"
                      style={{ width: '200px', marginLeft: '20px' }}
                      className={phNumError ? style.inputError : ''}
                      onChange={handlePhNumChange}
                      onBlur={checkPhNum}
                    />
                    <Input
                      value={telephoneExt}
                      placeholder="分机号（选填）"
                      style={{ width: '200px', marginLeft: '20px' }}
                      className={fjError ? style.inputError : ''}
                      onChange={handlePhFjChange}
                      onBlur={checkFJ}
                      maxLength={4}
                    />
                  </div>
                  <div className={style.formItemInfo}>手机号码示例: 138XXXX1234（分机号不填）</div>
                  <div className={style.formItemInfo}>固定电话示例: 010-95187XXX 4（分机号选填）</div>
                  {(phNumError || fjError) && <div className={style.formItemError}>{phNumError ? phNumError : fjError}</div>}
                </Item>
                <Item label="电子邮箱">
                  <Input
                    value={email}
                    style={{ width: '286px' }}
                    placeholder="请输入电子邮箱"
                    className={emError ? style.inputError : ''}
                    onChange={handleEmChange}
                    onBlur={checkEmail}
                  />
                  {emError && <div className={style.formItemError}>{emError}</div>}
                </Item>
              </div>
              <div className={style.createInfoTemplateContent}>
                <div className={style.title}>英文信息模板</div>
                {regType === 'I' && (
                  <>
                    <Item label="域名持有者姓名(姓)">
                      <Input
                        value={lastNameEnglish}
                        style={{ maxWidth: '520px' }}
                        placeholder="英文名或中文拼音，如：Zhang San"
                        maxLength={50}
                        className={lNEError ? style.inputError : ''}
                        onChange={handleLnChange}
                      />
                      <div className={style.formItemInfo}>如系统自动填充的拼音有误 (注意多音字、生僻字的翻译) ，请直接进行修改。</div>
                      {lNEError && <div className={style.formItemError}>{lNEError}</div>}
                    </Item>
                    <Item label="域名持有者姓名(名)">
                      <Input
                        value={firstNameEnglish}
                        style={{ maxWidth: '520px' }}
                        placeholder="英文名或中文拼音，如：Zhang San"
                        maxLength={50}
                        className={fNEError ? style.inputError : ''}
                        onChange={handleFnChange}
                      />
                      <div className={style.formItemInfo}>如系统自动填充的拼音有误 (注意多音字、生僻字的翻译) ，请直接进行修改。</div>
                      {fNEError && <div className={style.formItemError}>{fNEError}</div>}
                    </Item>
                  </>
                )}
                {regType === 'E' && (
                  <>
                    <Item label="所有者单位名称(英文)">
                      <Input
                        value={orgNameEnglish}
                        style={{ maxWidth: '520px' }}
                        placeholder="英文名或中文拼音，如：Zhang San"
                        maxLength={150}
                        className={oNEError ? style.inputError : ''}
                        onChange={handleOrgChange}
                      />
                      <div className={style.formItemInfo}>如系统自动填充的拼音有误 (注意多音字、生僻字的翻译) ，请直接进行修改。</div>
                      {oNEError && <div className={style.formItemError}>{oNEError}</div>}
                    </Item>
                    <Item label="单位联系人姓名(英文)">
                      <Input
                        value={fullNameEnglish}
                        style={{ maxWidth: '520px' }}
                        placeholder="英文名或中文拼音，如：Zhang San"
                        maxLength={100}
                        className={fullNameEError ? style.inputError : ''}
                        onChange={handleFullnameEChange}
                      />
                      <div className={style.formItemInfo}>如系统自动填充的拼音有误 (注意多音字、生僻字的翻译) ，请直接进行修改。</div>
                      {fullNameEError && <div className={style.formItemError}>{fullNameEError}</div>}
                    </Item>
                  </>
                )}
                <Item label="通讯地址(英文)">
                  <Input
                    value={addressEnglish}
                    style={{ maxWidth: '520px' }}
                    placeholder="请输入英文的通信地址"
                    maxLength={150}
                    className={adrEError ? style.inputError : ''}
                    onChange={handleAdrChange}
                  />
                  {adrEError && <div className={style.formItemError}>{adrEError}</div>}
                </Item>
              </div>
              <div className={style.createInfoTemplateContent}>
                <div className={style.title}>域名所有者身份认证</div>
                <Item label="证件类型">
                  <Select
                    value={idTypeGswl}
                    style={{ width: '286px' }}
                    onChange={handleIdTypeChange}
                    options={regType === 'I' ? IIDTypeList : EIDTypeList}
                    placeholder="请选择证件类型"
                  />
                  {idTypeGswl === 'SFZ' && <div className={style.formItemInfo}>请上传与域名所有者完全一致的身份证。</div>}
                  {iTError && <div className={style.formItemError}>{iTError}</div>}
                </Item>
                <Item label="证件照正面">
                  <div className={style.uploadContainer}>
                    <div className={style.uploadLine}>
                      <Dragger showUploadList={false} beforeUpload={beforeUpload} customRequest={customRequest}>
                        <div className={style.draggerContent}>
                          {imageUrl ? (
                            <img className={style.uploadImg} src={imageUrl} style={{ width: '100%' }} />
                          ) : (
                            <div className={style.uploadBtn}>
                              <div className={style.uploadIcon}>+</div>
                              <div className={style.uploadText}>点击上传</div>
                              <div className={style.uploadInfo}>或将文件拖拽至此</div>
                            </div>
                          )}
                          {loading && (
                            <div className={style.loadingContainer}>
                              <LoadingIcon />
                              <div className={style.loadingText}>上传中...</div>
                            </div>
                          )}
                          {tid && !imageUrl && !loading && (
                            <div className={style.uploadedContainer}>
                              <img src={Uploaded} />
                            </div>
                          )}
                          {(imageUrl || tid) && (
                            <div className={style.replaceMask}>
                              <ReplaceIcon />
                              <div className={style.replaceText}>替换</div>
                            </div>
                          )}
                        </div>
                      </Dragger>
                      {/* <div className={style.uploadExam}>
                                                <div>示例</div>
                                                {regType === 'I' && <img src={ExamI} />}
                                                {regType === 'E' && <img src={ExamE} />}
                                            </div> */}
                    </div>
                    {tid && <div className={style.warnInfo}>您的证件已上传至审核机构，但此处不展示此敏感信息</div>}
                    <div className={style.formItemInfo}>1.必须为彩色证件扫描件，内容清晰可见</div>
                    <div className={style.formItemInfo}>2.必须包含完整证件边框，无遮挡、无水印</div>
                    <div className={style.formItemInfo}>3.图片格式支持JPG、PNG、BMP等，大小为55KB~5MB</div>
                    <div className={style.formItemInfo}>4.新注证件建议7-10个自然日后再进行提交</div>
                  </div>
                  {wcfError && <div className={style.formItemError}>{wcfError}</div>}
                </Item>
                <Item label="证件号码">
                  <Input
                    value={idCode}
                    style={{ maxWidth: '520px' }}
                    placeholder="请输入证件号码"
                    maxLength={100}
                    className={iCError ? style.inputError : ''}
                    onChange={handleIdnumChange}
                  />
                  {iCError && <div className={style.formItemError}>{iCError}</div>}
                </Item>
                <Item label="同意协议">
                  <div className={style.checkBoxGroup}>
                    <Checkbox checked={checked} onChange={onCheckedChange}></Checkbox>
                    <div className={style.linkInfo}>
                      {getIn18Text('WOYIYUEDUBINGTONGYI')}
                      <a className={style.link} href="https://waimao.office.163.com/site/license.html" target="_blank">
                        《网易灵犀建站服务条款》
                      </a>
                      ，同时将信息资料授权给第三方服务机构
                    </div>
                  </div>
                </Item>
              </div>
            </Form>
          </div>
          <div className={style.confirm}>
            {submitLoading ? (
              <button className={style.submitBtnDisabled}>提交中...</button>
            ) : (
              <button className={style.submitBtn} onClick={submit}>
                确认提交
              </button>
            )}
          </div>
          <Modal
            zIndex={800}
            visible={showModal}
            getContainer={false}
            width={400}
            className={styles.selectModal}
            title={
              <div className={styles.infoTitle}>
                <InfoIcon />
                提示
              </div>
            }
            maskClosable={false}
            destroyOnClose={true}
            onCancel={hideConfirmModal}
            onOk={submitHandler}
          >
            <div className={styles.infoContent}>是否同意服务条款？</div>
          </Modal>
          <Modal
            zIndex={800}
            visible={showUploadModal}
            getContainer={false}
            width={400}
            className={styles.selectModal}
            title={
              <div className={styles.infoTitle}>
                <InfoIcon />
                提示
              </div>
            }
            maskClosable={false}
            destroyOnClose={true}
            onCancel={() => setShowUploadModal(false)}
            onOk={() => setShowUploadModal(false)}
            cancelButtonProps={{ style: { display: 'none' } }}
          >
            <div className={styles.infoContent}>支持上传JPG、PNG、BMP格式，大小为55KB~5MB的文件</div>
          </Modal>
        </div>
      )}
    </>
  );
};
