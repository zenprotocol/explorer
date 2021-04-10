import * as React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';
import { mergeDeepRight } from 'ramda';

const COLORS = {
  text: '#f2f2f2',
  textGray: '#999999',
  border: '#333333',
  bg: '#0e0e0e',
};

const titleStyle = {
  color: COLORS.textGray,
  fontWeight: '400',
  fontFamily: 'Roboto',
};

const styleOptions = {
  chart: {
    height: '50%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    style: { color: COLORS.text },
  },
  plotOptions: {
    series: {
      turboThreshold: 0,
      dataLabels: {
        color: COLORS.text,
      },
    },
    pie: {
      borderColor: COLORS.bg,
    },
  },
  title: {
    style: { display: 'none' },
  },
  colors: ['#3384f3', '#f63d3d', '#50d166'],
  xAxis: {
    gridLineWidth: 0,
    lineColor: COLORS.border,
    tickColor: COLORS.border,
    labels: {
      style: {
        color: COLORS.text,
        fontFamily: 'Roboto',
      },
    },
    title: {
      style: titleStyle,
    },
  },
  yAxis: {
    gridLineColor: COLORS.border,
    lineWidth: 0,
    tickWidth: 1,
    tickColor: '#000',
    labels: {
      style: {
        color: COLORS.text,
        fontFamily: 'Roboto',
      },
    },
    title: {
      style: titleStyle,
      margin: 20,
    },
  },
  legend: {
    enabled: false,
  },
  tooltip: {
    style: {
      fontFamily: 'Roboto',
    },
  },
  credits: {
    enabled: false,
  },
};

export default function Chart(props) {
  React.useEffect(() => {
    ReactHighcharts.Highcharts.setOptions({
      lang: {
        thousandsSep: ',',
      },
    });
  }, []);
  return <ReactHighcharts config={mergeDeepRight(styleOptions, props.config)} />;
}

Chart.propTypes = {
  config: PropTypes.object.isRequired,
};
