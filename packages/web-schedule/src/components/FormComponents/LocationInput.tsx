import { InputProps, Input } from 'antd';
import React from 'react';
import pasteInputHoc from '../PasteInput/PasteInput';
import MeetingRoomLocation, { LocationInputProps as MeetingRoomLocationProps } from '../LocationInput/LocationInput';

const PasteInput = pasteInputHoc(Input);

interface LocationInputProps extends InputProps {
  meetingRoomEnable?: boolean;
  renderSelectMeetingRoom(): JSX.Element;
  meetingRoomSelected?: boolean;
  meetingRoomLocationProps: MeetingRoomLocationProps;
}

const LocationInput: React.FC<LocationInputProps> = props => {
  const { meetingRoomEnable, suffix, renderSelectMeetingRoom, meetingRoomSelected, meetingRoomLocationProps, ...rest } = props;
  if (!meetingRoomSelected) {
    return <PasteInput suffix={meetingRoomEnable ? renderSelectMeetingRoom() : suffix} {...rest} />;
  }
  return <MeetingRoomLocation value={props.value as string} id={rest.id} {...meetingRoomLocationProps} />;
};

export default LocationInput;
