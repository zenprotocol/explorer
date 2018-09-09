import React from 'react';
import PropTypes from 'prop-types';
import Chart from './Chart.jsx';

export default function LineChart(props) {
  const { title, data, seriesTitle } = props;
  const config = {
    chart: {
      type: 'line',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: title,
      },
    },
    series: [
      {
        name: seriesTitle,
        data,
      },
    ],
  };
  return <Chart config={config} />;
}

LineChart.propTypes = {
  title: PropTypes.string,
  seriesTitle: PropTypes.string,
  data: PropTypes.array.isRequired,
};
