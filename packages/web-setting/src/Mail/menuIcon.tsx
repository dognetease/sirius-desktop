import React, { NamedExoticComponent, useEffect, useState } from 'react';
import { apiHolder, EventApi } from 'api';

const MenuIcon: React.FC<{
  name: string;
  tag: string;
  hidden: boolean;
  icon: NamedExoticComponent;
}> = props => {
  const eventApi: EventApi = apiHolder.api.getEventApi();

  return <div />;
};

export default MenuIcon;
