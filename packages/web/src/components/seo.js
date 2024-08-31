import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

function SEO({ lang, title }) {
  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      base={{ href: '//' }}
      title={title}
    />
  );
}

SEO.defaultProps = {
  lang: 'en',
  meta: [],
  description: '',
};

SEO.propTypes = {
  base: PropTypes.object,
  title: PropTypes.string.isRequired,
};

export default SEO;
